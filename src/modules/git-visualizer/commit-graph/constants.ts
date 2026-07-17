import type { CommitNode } from './types'

export const COMMIT_GRAPH_TITLE = 'Commit Graph'
export const COMMIT_GRAPH_ROUTE = '/tools/commit-graph'

export const DEFAULT_COMMITS: CommitNode[] = [
  { hash: 'abc123456789', message: 'Initial commit', branch: 'main', createdAt: '2026-01-01T00:00:00.000Z' },
]
