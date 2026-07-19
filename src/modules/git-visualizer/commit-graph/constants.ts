import type { CommitNode, GitRepository } from './types'

export const COMMIT_GRAPH_TITLE = 'Git Workspace'
export const COMMIT_GRAPH_ROUTE = '/git/visualizer'

const commits: Record<string, CommitNode> = {
  a1b2c3d: {
    hash: 'a1b2c3d',
    message: 'Initial commit',
    branch: 'main',
    author: 'ToolStack User',
    createdAt: '2026-07-19T09:00:00.000Z',
    parentHashes: [],
    files: { 'README.md': '# ToolStack\n\nA local developer workspace.\n' },
  },
  b2c3d4e: {
    hash: 'b2c3d4e',
    message: 'Add developer tools',
    branch: 'main',
    author: 'ToolStack User',
    createdAt: '2026-07-19T09:05:00.000Z',
    parentHashes: ['a1b2c3d'],
    files: {
      'README.md': '# ToolStack\n\nA local developer workspace.\n',
      'src/tools.ts': 'export const tools = ["json", "regex"]\n',
    },
  },
  c3d4e5f: {
    hash: 'c3d4e5f',
    message: 'Create Git visualizer',
    branch: 'main',
    author: 'ToolStack User',
    createdAt: '2026-07-19T09:10:00.000Z',
    parentHashes: ['b2c3d4e'],
    files: {
      'README.md': '# ToolStack\n\nA local developer workspace with visual tools.\n',
      'src/tools.ts': 'export const tools = ["json", "regex", "git"]\n',
    },
  },
}

export const DEFAULT_COMMITS = Object.values(commits)

export function createExampleRepository(): GitRepository {
  const head = commits.c3d4e5f
  return {
    commits: structuredClone(commits),
    branches: { main: head.hash },
    headBranch: 'main',
    workingTree: structuredClone(head.files),
    index: structuredClone(head.files),
    selectedHash: head.hash,
    conflicts: [],
  }
}
