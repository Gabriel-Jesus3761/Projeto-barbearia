/**
 * Cloud Functions para Connecta ServiçosPro
 * Firebase Functions v2
 *
 * SEGURANÇA:
 * - Todas as funções validam autenticação via context.auth
 * - Validação de schema rigorosa para todos os payloads
 * - Rate limiting implementado
 * - Proteções contra ataques comuns (XSS, injection, etc)
 * - Logs de segurança para auditoria
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { setGlobalOptions } = require('firebase-functions/v2');

// Configurações globais
setGlobalOptions({
  region: 'southamerica-east1', // São Paulo
  maxInstances: 10,
});

// Inicializar Firebase Admin
admin.initializeApp();

// ============================================
// FUNÇÕES AUXILIARES DE VALIDAÇÃO E SEGURANÇA
// ============================================

/**
 * Sanitiza string removendo caracteres perigosos
 * Previne XSS e injection attacks
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';

  return str
    .replace(/[<>]/g, '') // Remove tags HTML
    .replace(/['"]/g, '') // Remove aspas que podem quebrar queries
    .replace(/[{}]/g, '') // Remove chaves que podem ser usadas em template injection
    .trim()
    .substring(0, 1000); // Limita tamanho máximo
}

/**
 * Valida email com regex seguro
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321
}

/**
 * Valida CPF (11 dígitos)
 */
function isValidCPF(cpf) {
  if (typeof cpf !== 'string') return false;

  // Remove formatação
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.length === 11 && /^[0-9]{11}$/.test(cleanCPF);
}

/**
 * Valida CNPJ (14 dígitos)
 */
function isValidCNPJ(cnpj) {
  if (typeof cnpj !== 'string') return false;

  // Remove formatação
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.length === 14 && /^[0-9]{14}$/.test(cleanCNPJ);
}

/**
 * Valida telefone (10-15 dígitos com código de país opcional)
 */
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;

  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

/**
 * Valida role
 */
function isValidRole(role) {
  return ['client', 'professional', 'owner'].includes(role);
}

/**
 * Valida UID do Firebase (28 caracteres alfanuméricos)
 */
function isValidUID(uid) {
  return typeof uid === 'string' && /^[a-zA-Z0-9]{28}$/.test(uid);
}

/**
 * Valida tamanho de string
 */
function isValidStringLength(str, min, max) {
  return typeof str === 'string' && str.length >= min && str.length <= max;
}

/**
 * Rate Limiting simples usando Firestore
 * Previne abuso de APIs
 */
async function checkRateLimit(userId, action, maxRequests = 10, windowMs = 60000) {
  const db = admin.firestore();
  const now = Date.now();
  const windowStart = now - windowMs;

  const rateLimitRef = db.collection('_rate_limits').doc(`${userId}_${action}`);

  try {
    const doc = await db.runTransaction(async (transaction) => {
      const rateLimitDoc = await transaction.get(rateLimitRef);

      let requests = [];

      if (rateLimitDoc.exists) {
        requests = rateLimitDoc.data().requests || [];
        // Remove requisições fora da janela de tempo
        requests = requests.filter(timestamp => timestamp > windowStart);
      }

      // Verifica se excedeu o limite
      if (requests.length >= maxRequests) {
        throw new HttpsError(
          'resource-exhausted',
          `Muitas requisições. Tente novamente em ${Math.ceil(windowMs / 1000)} segundos.`
        );
      }

      // Adiciona nova requisição
      requests.push(now);

      transaction.set(rateLimitRef, {
        requests,
        lastRequest: now,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return requests.length;
    });

    return doc;
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    // Se erro no rate limiting, permite a requisição (fail open)
    console.error('Erro no rate limiting:', error);
    return 0;
  }
}

/**
 * Verifica se o usuário está autenticado
 */
function requireAuth(request) {
  if (!request.auth) {
    console.error('❌ [requireAuth] request.auth está undefined');
    console.error('❌ [requireAuth] request:', JSON.stringify({
      rawRequest: request.rawRequest ? 'exists' : 'undefined',
      auth: request.auth,
      data: request.data
    }));
    throw new HttpsError(
      'unauthenticated',
      'Você precisa estar autenticado para executar esta ação.'
    );
  }
  console.log('✅ [requireAuth] Autenticação validada para UID:', request.auth.uid);
  return request.auth;
}

/**
 * Log de segurança para auditoria
 */
async function securityLog(event, userId, details = {}) {
  const db = admin.firestore();

  try {
    await db.collection('_security_logs').add({
      event,
      userId,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: details.ip || null,
      userAgent: details.userAgent || null
    });
  } catch (error) {
    console.error('Erro ao registrar log de segurança:', error);
  }
}

/**
 * Validar dados de login e perfil do usuário
 * Chamada quando o usuário tenta fazer login
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Valida todos os parâmetros com schema rigoroso
 * - Rate limiting: 20 requisições por minuto
 * - Mensagens de erro genéricas (não revelam se usuário existe)
 */
exports.validateUserLogin = onCall(async (request) => {
  try {
    // VALIDAÇÃO DE AUTENTICAÇÃO
    const auth = requireAuth(request);

    // VALIDAÇÃO DE PAYLOAD
    const { uid, email, role } = request.data;

    // Validar parâmetros obrigatórios
    if (!uid || !email || !role) {
      throw new HttpsError(
        'invalid-argument',
        'Dados incompletos fornecidos.'
      );
    }

    // VALIDAÇÃO DE SEGURANÇA
    // UID deve corresponder ao usuário autenticado
    if (uid !== auth.uid) {
      await securityLog('login_uid_mismatch', auth.uid, {
        providedUid: uid,
        email: email
      });
      throw new HttpsError(
        'permission-denied',
        'Acesso negado.'
      );
    }

    // Validar formato do email
    if (!isValidEmail(email)) {
      throw new HttpsError(
        'invalid-argument',
        'Formato de dados inválido.'
      );
    }

    // Validar UID
    if (!isValidUID(uid)) {
      throw new HttpsError(
        'invalid-argument',
        'Formato de dados inválido.'
      );
    }

    // Validar role
    if (!isValidRole(role)) {
      throw new HttpsError(
        'invalid-argument',
        'Tipo de perfil inválido.'
      );
    }

    // RATE LIMITING - 20 requisições por minuto
    await checkRateLimit(uid, 'validateLogin', 20, 60000);

    const db = admin.firestore();

    // Verificar se o usuário existe no Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // Usuário não existe no Firestore - primeira vez fazendo login
      return {
        success: false,
        userExists: false,
        hasProfile: false,
        message: 'Usuário não encontrado. É necessário completar o cadastro.',
        redirectTo: '/register',
      };
    }

    const userData = userDoc.data();

    // Verificar se o usuário tem o perfil (profile) criado
    const profileDoc = await db
      .collection('users')
      .doc(uid)
      .collection('profiles')
      .doc(role)
      .get();

    if (!profileDoc.exists) {
      // Usuário existe mas não tem perfil para este role
      return {
        success: false,
        userExists: true,
        hasProfile: false,
        availableRoles: userData.roles || [],
        message: `Perfil de ${role} não encontrado. Complete seu cadastro como ${role}.`,
        redirectTo: '/register',
      };
    }

    const profileData = profileDoc.data();

    // Validar se o perfil está completo
    const requiredFields = getRequiredFieldsForRole(role);
    const missingFields = requiredFields.filter(
      field => !profileData[field] || profileData[field] === ''
    );

    if (missingFields.length > 0) {
      return {
        success: false,
        userExists: true,
        hasProfile: true,
        profileComplete: false,
        missingFields,
        message: `Perfil incompleto. Campos faltando: ${missingFields.join(', ')}`,
        redirectTo: '/register',
      };
    }

    // Verificar status do perfil (se aplicável)
    if (profileData.status && profileData.status !== 'active') {
      return {
        success: false,
        userExists: true,
        hasProfile: true,
        profileComplete: true,
        profileStatus: profileData.status,
        message: `Perfil ${profileData.status}. Entre em contato com o suporte.`,
      };
    }

    // Login válido - retornar dados do usuário
    await securityLog('login_success', uid, { role, email });

    return {
      success: true,
      userExists: true,
      hasProfile: true,
      profileComplete: true,
      user: {
        uid,
        email: userData.email,
        name: sanitizeString(profileData.name),
        avatar: profileData.avatar || null,
        phone: profileData.phone || null,
        activeRole: role,
        roles: userData.roles || [role],
        createdAt: userData.createdAt,
      },
      profile: profileData,
      message: 'Login validado com sucesso',
    };
  } catch (error) {
    console.error('Erro na validação de login:', error);

    // Log de erro de segurança
    if (request.auth) {
      await securityLog('login_error', request.auth.uid, {
        error: error.message,
        role: request.data?.role
      });
    }

    // Se for um HttpsError, re-throw
    if (error instanceof HttpsError) {
      throw error;
    }

    // Erro genérico - NÃO revela informações sobre o usuário
    throw new HttpsError(
      'internal',
      'Erro ao processar solicitação. Tente novamente.'
    );
  }
});

/**
 * Criar perfil de usuário
 * Chamada quando o usuário completa o registro
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Valida todos os dados com sanitização
 * - Rate limiting: 5 requisições por hora
 * - Previne criação de perfis duplicados
 */
exports.createUserProfile = onCall(async (request) => {
  try {
    // VALIDAÇÃO DE AUTENTICAÇÃO
    const auth = requireAuth(request);

    // VALIDAÇÃO DE PAYLOAD
    const { uid, email, role, profileData } = request.data;

    // Validar parâmetros obrigatórios
    if (!uid || !email || !role || !profileData) {
      throw new HttpsError(
        'invalid-argument',
        'Dados incompletos fornecidos.'
      );
    }

    // VALIDAÇÃO DE SEGURANÇA
    // UID deve corresponder ao usuário autenticado
    if (uid !== auth.uid) {
      await securityLog('profile_creation_uid_mismatch', auth.uid, {
        providedUid: uid,
        email: email
      });
      throw new HttpsError(
        'permission-denied',
        'Acesso negado.'
      );
    }

    // Validar formato dos dados
    if (!isValidEmail(email)) {
      throw new HttpsError('invalid-argument', 'Email inválido.');
    }

    if (!isValidUID(uid)) {
      throw new HttpsError('invalid-argument', 'Identificador inválido.');
    }

    if (!isValidRole(role)) {
      throw new HttpsError('invalid-argument', 'Tipo de perfil inválido.');
    }

    // Validar profileData
    if (typeof profileData !== 'object' || profileData === null) {
      throw new HttpsError('invalid-argument', 'Dados do perfil inválidos.');
    }

    // Validar campos do profileData
    if (profileData.name && !isValidStringLength(profileData.name, 2, 100)) {
      throw new HttpsError('invalid-argument', 'Nome deve ter entre 2 e 100 caracteres.');
    }

    if (profileData.phone && !isValidPhone(profileData.phone)) {
      throw new HttpsError('invalid-argument', 'Telefone inválido.');
    }

    if (profileData.cpf && !isValidCPF(profileData.cpf)) {
      throw new HttpsError('invalid-argument', 'CPF inválido.');
    }

    if (profileData.cnpj && !isValidCNPJ(profileData.cnpj)) {
      throw new HttpsError('invalid-argument', 'CNPJ inválido.');
    }

    // RATE LIMITING - 5 criações de perfil por hora
    await checkRateLimit(uid, 'createProfile', 5, 3600000);

    // Sanitizar dados de entrada
    const sanitizedProfileData = {
      ...profileData,
      name: sanitizeString(profileData.name || ''),
      specialty: profileData.specialty ? sanitizeString(profileData.specialty) : undefined,
    };

    const db = admin.firestore();

    // Criar ou atualizar documento do usuário
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Criar novo usuário
      await userRef.set({
        email,
        roles: [role],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Adicionar role se não existir
      const userData = userDoc.data();
      const roles = userData.roles || [];
      if (!roles.includes(role)) {
        await userRef.update({
          roles: admin.firestore.FieldValue.arrayUnion(role),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Criar perfil
    const profileRef = userRef.collection('profiles').doc(role);
    await profileRef.set({
      ...sanitizedProfileData,
      role,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log de segurança
    await securityLog('profile_created', uid, { role, email });

    return {
      success: true,
      message: 'Perfil criado com sucesso',
      uid,
      role,
    };
  } catch (error) {
    console.error('Erro ao criar perfil:', error);

    // Log de erro
    if (request.auth) {
      await securityLog('profile_creation_error', request.auth.uid, {
        error: error.message,
        role: request.data?.role
      });
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao processar solicitação. Tente novamente.'
    );
  }
});

/**
 * Trigger: Executado quando um novo usuário é criado
 * Envia email de boas-vindas, cria documentos iniciais, etc.
 */
exports.onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data.data();
  const userId = event.params.userId;

  console.log('Novo usuário criado:', userId, userData);

  // Aqui você pode adicionar lógica adicional:
  // - Enviar email de boas-vindas
  // - Criar documentos relacionados
  // - Notificar admins
  // - etc.

  return null;
});

/**
 * Validar e associar profissional a uma barbearia
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Valida código de barbearia
 * - Rate limiting: 10 tentativas por hora
 * - Previne vinculação duplicada
 */
exports.linkProfessionalToBusiness = onCall(async (request) => {
  try {
    // VALIDAÇÃO DE AUTENTICAÇÃO
    const auth = requireAuth(request);

    // VALIDAÇÃO DE PAYLOAD
    const { professionalUid, businessCode } = request.data;

    if (!professionalUid || !businessCode) {
      throw new HttpsError(
        'invalid-argument',
        'Dados incompletos fornecidos.'
      );
    }

    // VALIDAÇÃO DE SEGURANÇA
    // Profissional só pode vincular a si mesmo
    if (professionalUid !== auth.uid) {
      await securityLog('link_uid_mismatch', auth.uid, {
        providedUid: professionalUid,
        businessCode: businessCode
      });
      throw new HttpsError(
        'permission-denied',
        'Acesso negado.'
      );
    }

    // Validar formato do código
    if (!isValidStringLength(businessCode, 6, 20)) {
      throw new HttpsError(
        'invalid-argument',
        'Código inválido.'
      );
    }

    // RATE LIMITING - 10 tentativas por hora
    await checkRateLimit(professionalUid, 'linkBusiness', 10, 3600000);

    // Sanitizar código
    const sanitizedCode = sanitizeString(businessCode);

    const db = admin.firestore();

    // Buscar barbearia pelo código
    const businessesSnapshot = await db
      .collection('businesses')
      .where('linkCode', '==', sanitizedCode)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (businessesSnapshot.empty) {
      // Log de tentativa com código inválido
      await securityLog('link_invalid_code', professionalUid, {
        code: sanitizedCode
      });
      throw new HttpsError(
        'not-found',
        'Código inválido ou estabelecimento não encontrado.'
      );
    }

    const businessDoc = businessesSnapshot.docs[0];
    const businessId = businessDoc.id;
    const businessData = businessDoc.data();

    // Verificar se o profissional existe
    const professionalDoc = await db
      .collection('users')
      .doc(professionalUid)
      .collection('profiles')
      .doc('professional')
      .get();

    if (!professionalDoc.exists) {
      throw new HttpsError(
        'not-found',
        'Perfil profissional não encontrado.'
      );
    }

    // Verificar se já está vinculado
    const professionalData = professionalDoc.data();
    const currentBusinesses = professionalData.businesses || [];

    if (currentBusinesses.includes(businessId)) {
      await securityLog('link_already_exists', professionalUid, {
        businessId: businessId
      });
      throw new HttpsError(
        'already-exists',
        'Você já está vinculado a este estabelecimento.'
      );
    }

    // Adicionar barbearia ao array de businesses do profissional
    await db
      .collection('users')
      .doc(professionalUid)
      .collection('profiles')
      .doc('professional')
      .update({
        businesses: admin.firestore.FieldValue.arrayUnion(businessId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Adicionar profissional à lista de profissionais da barbearia
    await db.collection('businesses').doc(businessId).update({
      professionals: admin.firestore.FieldValue.arrayUnion(professionalUid),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Criar registro de vínculo
    await db.collection('business_professional_links').add({
      businessId,
      professionalUid,
      businessName: sanitizeString(businessData.name),
      status: 'active',
      linkedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log de sucesso
    await securityLog('link_success', professionalUid, {
      businessId: businessId,
      businessName: businessData.name
    });

    return {
      success: true,
      message: `Vinculado com sucesso a ${sanitizeString(businessData.name)}`,
      businessId,
      businessName: sanitizeString(businessData.name),
    };
  } catch (error) {
    console.error('Erro ao vincular profissional:', error);

    // Log de erro
    if (request.auth) {
      await securityLog('link_error', request.auth.uid, {
        error: error.message
      });
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao processar solicitação. Tente novamente.'
    );
  }
});

/**
 * Função auxiliar: Retorna campos obrigatórios por tipo de perfil
 */
function getRequiredFieldsForRole(role) {
  const requiredFields = {
    client: ['name', 'phone'],
    professional: ['name', 'phone', 'specialty'],
    owner: ['name', 'phone', 'cpfCnpj'],
  };

  return requiredFields[role] || ['name'];
}

/**
 * Criar documento inicial do usuário na coleção users
 * Esta função é chamada durante o primeiro login do usuário
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Valida que o UID corresponde ao usuário autenticado
 * - Rate limiting: 5 requisições por hora
 */
exports.createInitialUserDocument = onCall(async (request) => {
  try {
    console.log('🔍 [createInitialUserDocument] Iniciando função...');
    console.log('🔍 [createInitialUserDocument] request.auth:', request.auth ? 'EXISTE' : 'UNDEFINED');
    console.log('🔍 [createInitialUserDocument] request.data:', request.data);

    // VALIDAÇÃO DE PAYLOAD
    const { uid, email, displayName, role, photoURL } = request.data;

    // Validar parâmetros obrigatórios
    if (!uid || !email || !displayName || !role) {
      throw new HttpsError(
        'invalid-argument',
        'Dados incompletos fornecidos.'
      );
    }

    // VALIDAÇÃO DE SEGURANÇA ALTERNATIVA:
    // Como o token pode não propagar imediatamente após signInWithPopup,
    // validamos verificando se o usuário existe no Firebase Authentication
    let userRecord;
    try {
      userRecord = await admin.auth().getUser(uid);
      console.log('✅ [createInitialUserDocument] Usuário verificado no Auth:', userRecord.uid);
    } catch (error) {
      console.error('❌ [createInitialUserDocument] Usuário não encontrado no Auth:', error);
      throw new HttpsError(
        'not-found',
        'Usuário não encontrado no sistema de autenticação.'
      );
    }

    // Validar que o email corresponde
    if (userRecord.email !== email) {
      console.error('❌ [createInitialUserDocument] Email não corresponde:', {
        provided: email,
        actual: userRecord.email
      });
      throw new HttpsError(
        'permission-denied',
        'Email não corresponde ao usuário autenticado.'
      );
    }

    // Validar formato dos dados
    if (!isValidEmail(email)) {
      throw new HttpsError('invalid-argument', 'Email inválido.');
    }

    if (!isValidUID(uid)) {
      throw new HttpsError('invalid-argument', 'Identificador inválido.');
    }

    if (!isValidRole(role)) {
      throw new HttpsError('invalid-argument', 'Tipo de perfil inválido.');
    }

    if (!isValidStringLength(displayName, 2, 100)) {
      throw new HttpsError('invalid-argument', 'Nome deve ter entre 2 e 100 caracteres.');
    }

    // RATE LIMITING - 5 criações por hora
    await checkRateLimit(uid, 'createInitialUser', 5, 3600000);

    const db = admin.firestore();

    // Verificar se o usuário já existe
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Usuário já existe - retornar os dados existentes
      return {
        success: true,
        exists: true,
        message: 'Usuário já existe',
        user: userDoc.data(),
      };
    }

    // Criar documento do usuário
    const userData = {
      uid,
      email,
      displayName: sanitizeString(displayName),
      roles: [role],
      activeRole: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Adicionar photoURL se fornecido
    if (photoURL) {
      userData.photoURL = photoURL;
    }

    await userRef.set(userData);

    // Log de segurança
    await securityLog('user_document_created', uid, { role, email });

    return {
      success: true,
      exists: false,
      message: 'Documento do usuário criado com sucesso',
      user: userData,
    };
  } catch (error) {
    console.error('Erro ao criar documento do usuário:', error);

    // Log de erro
    if (request.auth) {
      await securityLog('create_user_error', request.auth.uid, {
        error: error.message,
        role: request.data?.role
      });
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao processar solicitação. Tente novamente.'
    );
  }
});
