import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface VisitorData {
  visitorId: string
  firstVisit: Timestamp
  lastVisit: Timestamp
  visitCount: number
  userAgent?: string
  referrer?: string
  pagesVisited: string[]
}

/**
 * Gera um ID único para o visitante
 */
function generateVisitorId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Obtém ou cria um ID de visitante
 * Armazena no localStorage para persistência
 */
export function getOrCreateVisitorId(): string {
  const STORAGE_KEY = 'connecta_visitor_id'

  // Tenta obter do localStorage
  let visitorId = localStorage.getItem(STORAGE_KEY)

  if (!visitorId) {
    // Cria novo ID
    visitorId = generateVisitorId()
    localStorage.setItem(STORAGE_KEY, visitorId)
    console.log('[visitorService] Novo visitante criado:', visitorId)
  } else {
    console.log('[visitorService] Visitante existente:', visitorId)
  }

  return visitorId
}

/**
 * Registra ou atualiza a visita de um usuário anônimo
 */
export async function trackAnonymousVisit(pagePath: string = '/'): Promise<void> {
  try {
    const visitorId = getOrCreateVisitorId()
    const visitorRef = doc(db, 'visitors', visitorId)

    // Verifica se já existe
    const visitorDoc = await getDoc(visitorRef)

    if (visitorDoc.exists()) {
      // Atualiza visitante existente
      const currentData = visitorDoc.data() as VisitorData
      const pagesVisited = currentData.pagesVisited || []

      // Adiciona a página se ainda não foi visitada
      if (!pagesVisited.includes(pagePath)) {
        pagesVisited.push(pagePath)
      }

      await updateDoc(visitorRef, {
        lastVisit: serverTimestamp(),
        visitCount: (currentData.visitCount || 0) + 1,
        pagesVisited,
      })

      console.log('[visitorService] Visita atualizada:', visitorId)
    } else {
      // Cria novo registro de visitante
      const visitorData: VisitorData = {
        visitorId,
        firstVisit: serverTimestamp() as Timestamp,
        lastVisit: serverTimestamp() as Timestamp,
        visitCount: 1,
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
        pagesVisited: [pagePath],
      }

      await setDoc(visitorRef, visitorData)
      console.log('[visitorService] Novo visitante registrado:', visitorId)
    }
  } catch (error) {
    console.error('[visitorService] Erro ao registrar visita:', error)
    // Não propaga o erro para não afetar a experiência do usuário
  }
}

/**
 * Obtém dados do visitante atual
 */
export async function getVisitorData(): Promise<VisitorData | null> {
  try {
    const visitorId = getOrCreateVisitorId()
    const visitorRef = doc(db, 'visitors', visitorId)
    const visitorDoc = await getDoc(visitorRef)

    if (visitorDoc.exists()) {
      return visitorDoc.data() as VisitorData
    }

    return null
  } catch (error) {
    console.error('[visitorService] Erro ao buscar dados do visitante:', error)
    return null
  }
}

/**
 * Limpa o ID do visitante (útil para testes ou logout)
 */
export function clearVisitorId(): void {
  const STORAGE_KEY = 'connecta_visitor_id'
  localStorage.removeItem(STORAGE_KEY)
  console.log('[visitorService] ID de visitante removido')
}
