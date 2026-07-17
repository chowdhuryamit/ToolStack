import { db } from '../db'
import type { LocalProject } from '../types'

export const projectRepository = {
  list() {
    return db.projects.orderBy('updatedAt').reverse().toArray()
  },
  listByType(type: LocalProject['type']) {
    return db.projects.where('type').equals(type).reverse().sortBy('updatedAt')
  },
  get(id: string) {
    return db.projects.get(id)
  },
  save(project: LocalProject) {
    return db.projects.put(project)
  },
  remove(id: string) {
    return db.projects.delete(id)
  },
}
