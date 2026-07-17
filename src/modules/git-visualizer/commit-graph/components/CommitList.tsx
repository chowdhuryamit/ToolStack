import type { CommitNode } from '../types'

type CommitListProps = {
  commits: CommitNode[]
}

export function CommitList({ commits }: CommitListProps) {
  return (
    <ul>
      {commits.map((commit) => (
        <li key={commit.hash}>{commit.message}</li>
      ))}
    </ul>
  )
}
