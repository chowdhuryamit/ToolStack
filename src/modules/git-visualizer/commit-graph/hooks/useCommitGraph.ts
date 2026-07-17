import { useMemo, useState } from 'react'
import { DEFAULT_COMMITS } from '../constants'
import { getBranches } from '../utilities/getBranches'

export function useCommitGraph() {
  const branches = useMemo(() => getBranches(DEFAULT_COMMITS), [])
  const [branch, setBranch] = useState(branches[0] ?? 'main')

  return { branch, branches, commits: DEFAULT_COMMITS, setBranch }
}
