import { db } from '../db'
import type { LocalSnippet } from '../types'

export const snippetRepository = {
  list() {
    return db.snippets.orderBy('updatedAt').reverse().toArray()
  },
  listUnsynced() {
    return db.snippets.where('synced').equals(0).toArray()
  },
  get(id: string) {
    return db.snippets.get(id)
  },
  save(snippet: LocalSnippet) {
    return db.snippets.put(snippet)
  },
  remove(id: string) {
    return db.snippets.delete(id)
  },
}
