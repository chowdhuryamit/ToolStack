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

type CloudSnippetBase = {
  id: string
  title: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CloudJsonSnippet = CloudSnippetBase & { type: 'json'; content: string }
export type CloudJsonDiff = CloudSnippetBase & { type: 'json-diff'; original: string; modified: string }
export type CloudSnippet = CloudJsonSnippet | CloudJsonDiff

type StoredJsonDiff = {
  __toolstackType: 'json-diff'
  version: 1
  original: string
  modified: string
}

function encodeJsonDiff(original: string, modified: string) {
  return JSON.stringify({
    __toolstackType: 'json-diff',
    version: 1,
    original,
    modified,
  } satisfies StoredJsonDiff)
}

function decodeJsonDiff(content: string): StoredJsonDiff | null {
  try {
    const value = JSON.parse(content) as Partial<StoredJsonDiff>
    if (value.__toolstackType !== 'json-diff' || value.version !== 1 || typeof value.original !== 'string' || typeof value.modified !== 'string') return null
    return value as StoredJsonDiff
  } catch {
    return null
  }
}

function requireUserId() {
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('Sign in before saving JSON.')
  return userId
}

function jsonCollection(userId: string) {
  return collection(firestore, 'users', userId, 'json')
}

function jsonDiffCollection(userId: string) {
  return collection(firestore, 'users', userId, 'json-diff')
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

  async saveDiff(title: string, original: string, modified: string) {
    const userId = requireUserId()
    const content = encodeJsonDiff(original, modified)
    if (content.length > 900000) throw new Error('This comparison is too large to save. Keep the combined JSON under 900 KB.')
    const reference = await addDoc(jsonDiffCollection(userId), {
      title,
      type: 'json-diff',
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return reference.id
  },

  async list(): Promise<CloudJsonSnippet[]> {
    const userId = requireUserId()
    const snapshot = await getDocs(query(jsonCollection(userId), orderBy('updatedAt', 'desc')))
    return snapshot.docs.map((item) => {
      const data = item.data()
      const content = String(data.content)
      return {
        id: item.id,
        title: String(data.title),
        type: 'json' as const,
        content,
        createdAt: (data.createdAt as Timestamp | null) ?? null,
        updatedAt: (data.updatedAt as Timestamp | null) ?? null,
      }
    })
  },

  async listDiffs(): Promise<CloudJsonDiff[]> {
    const userId = requireUserId()
    const snapshot = await getDocs(query(jsonDiffCollection(userId), orderBy('updatedAt', 'desc')))
    return snapshot.docs.flatMap((item) => {
      const data = item.data()
      const storedDiff = decodeJsonDiff(String(data.content))
      if (!storedDiff) return []
      return [{
        id: item.id,
        title: String(data.title),
        type: 'json-diff' as const,
        original: storedDiff.original,
        modified: storedDiff.modified,
        createdAt: (data.createdAt as Timestamp | null) ?? null,
        updatedAt: (data.updatedAt as Timestamp | null) ?? null,
      }]
    })
  },

  async hasAny() {
    const userId = requireUserId()
    const snapshot = await getDocs(query(jsonCollection(userId), limit(1)))
    return !snapshot.empty
  },

  async hasAnyDiff() {
    const userId = requireUserId()
    const snapshot = await getDocs(query(jsonDiffCollection(userId), limit(1)))
    return !snapshot.empty
  },

  async remove(snippetId: string) {
    const userId = requireUserId()
    await deleteDoc(doc(firestore, 'users', userId, 'json', snippetId))
  },

  async removeDiff(snippetId: string) {
    const userId = requireUserId()
    await deleteDoc(doc(firestore, 'users', userId, 'json-diff', snippetId))
  },
}
