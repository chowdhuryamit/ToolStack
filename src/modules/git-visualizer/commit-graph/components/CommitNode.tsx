import type { CommitNode as CommitNodeType } from '../types'

type CommitNodeProps = {
  commit: CommitNodeType
}

export function CommitNode({ commit }: CommitNodeProps) {
  return <span title={commit.hash}>{commit.message}</span>
}
