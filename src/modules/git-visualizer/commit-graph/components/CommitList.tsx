import type { CommitNode } from '../types'

type CommitListProps = {
  commits: CommitNode[]
  selectedHash: string
  onSelect: (hash: string) => void
}

export function CommitList({ commits, selectedHash, onSelect }: CommitListProps) {
  return (
    <div className="git-commit-list">
      {commits.map((commit) => (
        <button className="git-commit-row" aria-pressed={selectedHash === commit.hash} type="button" key={commit.hash} onClick={() => onSelect(commit.hash)}>
          <code>{commit.hash}</code>
          <span><strong>{commit.message}</strong><small>{commit.branch} · {new Date(commit.createdAt).toLocaleString()}</small></span>
        </button>
      ))}
    </div>
  )
}
