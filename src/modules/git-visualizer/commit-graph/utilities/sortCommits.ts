import type { CommitNode } from '../types'

export function sortCommits(commits: CommitNode[]) {
  return [...commits].sort((first, second) => second.createdAt.localeCompare(first.createdAt))
}
