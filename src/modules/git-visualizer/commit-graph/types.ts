export type FileSnapshot = Record<string, string>

export type CommitNode = {
  hash: string
  message: string
  branch: string
  author: string
  createdAt: string
  parentHashes: string[]
  files: FileSnapshot
}

export type GitRepository = {
  commits: Record<string, CommitNode>
  branches: Record<string, string>
  headBranch: string
  workingTree: FileSnapshot
  index: FileSnapshot
  selectedHash: string
  mergeParent?: string
  conflicts: string[]
}

export type FileChange = {
  path: string
  staged: 'added' | 'modified' | 'deleted' | undefined
  unstaged: 'added' | 'modified' | 'deleted' | undefined
  conflicted: boolean
}

export type ConsoleEntry = {
  id: string
  command: string
  output: string
  kind: 'success' | 'error' | 'info'
}
