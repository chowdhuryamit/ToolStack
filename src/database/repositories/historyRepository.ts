import { db } from '../db'
import type { ToolHistory } from '../types'

export const historyRepository = {
  list() {
    return db.history.orderBy('createdAt').reverse().toArray()
  },
  listByTool(toolId: string) {
    return db.history.where('toolId').equals(toolId).reverse().sortBy('createdAt')
  },
  add(entry: ToolHistory) {
    return db.history.put(entry)
  },
  clear() {
    return db.history.clear()
  },
}
