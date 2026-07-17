import type { CommitNode } from '../types'

export function getBranches(commits: CommitNode[]) {
  return Array.from(new Set(commits.map((commit) => commit.branch)))
}
