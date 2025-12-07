/**
 * Service para integração com Firebase Cloud Functions
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { auth } from '@/lib/firebase';

const functions = getFunctions(app, 'southamerica-east1'); // Região São Paulo

// IMPORTANTE: Para desenvolvimento local, descomente a linha abaixo
// connectFunctionsEmulator(functions, 'localhost', 5001);

/**
 * Tipos
 */
export interface ValidateLoginRequest {
  uid: string;
  email: string;
  role: 'client' | 'professional' | 'owner';
}

export interface ValidateLoginResponse {
  success: boolean;
  userExists: boolean;
  hasProfile: boolean;
  profileComplete?: boolean;
  message: string;
  user?: {
    uid: string;
    email: string;
    name: string;
    avatar: string | null;
    phone: string | null;
    activeRole: string;
    roles: string[];
    createdAt: any;
  };
  profile?: any;
  redirectTo?: string;
  missingFields?: string[];
  availableRoles?: string[];
}

export interface CreateProfileRequest {
  uid: string;
  email: string;
  role: 'client' | 'professional' | 'owner';
  profileData: {
    name: string;
    phone: string;
    avatar?: string;
    specialty?: string; // Para professional
    cpfCnpj?: string; // Para owner
  };
}

export interface CreateProfileResponse {
  success: boolean;
  message: string;
  uid: string;
  role: string;
}

export interface LinkProfessionalRequest {
  professionalUid: string;
  businessCode: string;
}

export interface LinkProfessionalResponse {
  success: boolean;
  message: string;
  businessId: string;
  businessName: string;
}

/**
 * Valida login do usuário
 */
export async function validateUserLogin(
  uid: string,
  email: string,
  role: 'client' | 'professional' | 'owner'
): Promise<ValidateLoginResponse> {
  try {
    const validateLogin = httpsCallable<ValidateLoginRequest, ValidateLoginResponse>(
      functions,
      'validateUserLogin'
    );

    const result = await validateLogin({ uid, email, role });
    return result.data;
  } catch (error: any) {
    console.error('Erro ao validar login:', error);
    throw new Error(error.message || 'Erro ao validar login');
  }
}

/**
 * Cria perfil de usuário
 */
export async function createUserProfile(
  uid: string,
  email: string,
  role: 'client' | 'professional' | 'owner',
  profileData: {
    name: string;
    phone: string;
    avatar?: string;
    specialty?: string;
    cpfCnpj?: string;
  }
): Promise<CreateProfileResponse> {
  try {
    const createProfile = httpsCallable<CreateProfileRequest, CreateProfileResponse>(
      functions,
      'createUserProfile'
    );

    const result = await createProfile({ uid, email, role, profileData });
    return result.data;
  } catch (error: any) {
    console.error('Erro ao criar perfil:', error);
    throw new Error(error.message || 'Erro ao criar perfil');
  }
}

/**
 * Vincula profissional a estabelecimento
 */
export async function linkProfessionalToBusiness(
  professionalUid: string,
  businessCode: string
): Promise<LinkProfessionalResponse> {
  try {
    const linkProfessional = httpsCallable<LinkProfessionalRequest, LinkProfessionalResponse>(
      functions,
      'linkProfessionalToBusiness'
    );

    const result = await linkProfessional({ professionalUid, businessCode });
    return result.data;
  } catch (error: any) {
    console.error('Erro ao vincular profissional:', error);
    throw new Error(error.message || 'Erro ao vincular profissional');
  }
}

/**
 * Cria documento inicial do usuário na coleção users
 * Chamada durante o primeiro login via Google/Facebook
 */
export async function createInitialUserDocument(
  uid: string,
  email: string,
  displayName: string,
  role: 'client' | 'professional' | 'owner',
  photoURL?: string,
  userFromSignIn?: any // Objeto user retornado do signInWithPopup
): Promise<{ success: boolean; exists: boolean; message: string; user: any }> {
  try {
    // Usar o user fornecido ou pegar do auth.currentUser
    const currentUser = userFromSignIn || auth.currentUser;

    if (!currentUser) {
      throw new Error('Usuário não está autenticado');
    }

    // Obter o token de autenticação explicitamente e aguardar propagação
    await currentUser.getIdToken(true); // Force refresh

    // Aguardar 500ms para o token propagar no sistema do Firebase
    await new Promise(resolve => setTimeout(resolve, 500));

    const createInitialUser = httpsCallable(
      functions,
      'createInitialUserDocument'
    );

    // Tentar até 3 vezes com delay crescente
    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await createInitialUser({ uid, email, displayName, role, photoURL });
        return result.data as any;
      } catch (error: any) {
        lastError = error;
        if (error.code === 'functions/unauthenticated' && attempt < 3) {
          const delay = attempt * 1000; // 1s, 2s
          // Forçar refresh do token novamente
          await currentUser.getIdToken(true);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  } catch (error: any) {
    console.error('[createInitialUserDocument] Erro ao criar documento:', error.message);
    throw new Error(error.message || 'Erro ao criar documento do usuário');
  }
}
