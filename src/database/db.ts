import Dexie, { type Table } from 'dexie'
import type { LocalProject, LocalSnippet, ToolHistory } from './types'

export class DevoraDatabase extends Dexie {
  snippets!: Table<LocalSnippet, string>
  history!: Table<ToolHistory, string>
  projects!: Table<LocalProject, string>

  constructor() {
    super('devora')

    this.version(1).stores({
      snippets: 'id, type, updatedAt, synced',
      history: 'id, toolId, createdAt',
      projects: 'id, type, updatedAt',
    })
  }
}

export const db = new DevoraDatabase()
