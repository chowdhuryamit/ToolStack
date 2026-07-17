import type { CommitNode } from '../types'

type GraphCanvasProps = {
  commits: CommitNode[]
}

export function GraphCanvas({ commits }: GraphCanvasProps) {
  return <pre>{commits.map((commit) => `* ${commit.hash.slice(0, 7)} ${commit.message}`).join('\n')}</pre>
}
