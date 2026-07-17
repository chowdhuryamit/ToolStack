import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { auth } from './auth'
import { firestore } from './firestore'

export type CloudSnippet = {
  id: string
  title: string
  type: 'json'
  content: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

function requireUserId() {
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('Sign in before saving JSON.')
  return userId
}

function jsonCollection(userId: string) {
  return collection(firestore, 'users', userId, 'json')
}

export const firebaseSnippetRepository = {
  async save(title: string, content: string) {
    const userId = requireUserId()
    const reference = await addDoc(jsonCollection(userId), {
      title,
      type: 'json',
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return reference.id
  },

  async list(): Promise<CloudSnippet[]> {
    const userId = requireUserId()
    const snapshot = await getDocs(query(jsonCollection(userId), orderBy('updatedAt', 'desc')))
    return snapshot.docs.map((item) => {
      const data = item.data()
      return {
        id: item.id,
        title: String(data.title),
        type: 'json',
        content: String(data.content),
        createdAt: (data.createdAt as Timestamp | null) ?? null,
        updatedAt: (data.updatedAt as Timestamp | null) ?? null,
      }
    })
  },

  async hasAny() {
    const userId = requireUserId()
    const snapshot = await getDocs(query(jsonCollection(userId), limit(1)))
    return !snapshot.empty
  },

  async remove(snippetId: string) {
    const userId = requireUserId()
    await deleteDoc(doc(firestore, 'users', userId, 'json', snippetId))
  },
}
