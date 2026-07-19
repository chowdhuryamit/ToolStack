import type { FileChange, FileSnapshot, GitRepository } from '../types'

export function snapshotsEqual(first: FileSnapshot, second: FileSnapshot) {
  const keys = new Set([...Object.keys(first), ...Object.keys(second)])
  return [...keys].every((key) => first[key] === second[key])
}

function changeKind(before: string | undefined, after: string | undefined): FileChange['staged'] {
  if (before === after) return undefined
  if (before === undefined) return 'added'
  if (after === undefined) return 'deleted'
  return 'modified'
}

export function getFileChanges(repository: GitRepository): FileChange[] {
  const headFiles = repository.commits[repository.branches[repository.headBranch]]?.files ?? {}
  const paths = new Set([
    ...Object.keys(headFiles),
    ...Object.keys(repository.index),
    ...Object.keys(repository.workingTree),
  ])

  return [...paths].sort().map((path) => ({
    path,
    staged: changeKind(headFiles[path], repository.index[path]),
    unstaged: changeKind(repository.index[path], repository.workingTree[path]),
    conflicted: repository.conflicts.includes(path),
  }))
}

export function isAncestor(repository: GitRepository, ancestor: string, descendant: string) {
  const pending = [descendant]
  const visited = new Set<string>()
  while (pending.length) {
    const hash = pending.pop()
    if (!hash || visited.has(hash)) continue
    if (hash === ancestor) return true
    visited.add(hash)
    pending.push(...(repository.commits[hash]?.parentHashes ?? []))
  }
  return false
}

export function findMergeBase(repository: GitRepository, first: string, second: string) {
  const firstAncestors = new Set<string>()
  const pending = [first]
  while (pending.length) {
    const hash = pending.shift()
    if (!hash || firstAncestors.has(hash)) continue
    firstAncestors.add(hash)
    pending.push(...(repository.commits[hash]?.parentHashes ?? []))
  }

  const secondPending = [second]
  const visited = new Set<string>()
  while (secondPending.length) {
    const hash = secondPending.shift()
    if (!hash || visited.has(hash)) continue
    if (firstAncestors.has(hash)) return hash
    visited.add(hash)
    secondPending.push(...(repository.commits[hash]?.parentHashes ?? []))
  }
  return undefined
}

export function mergeSnapshots(base: FileSnapshot, current: FileSnapshot, incoming: FileSnapshot) {
  const files: FileSnapshot = {}
  const conflicts: string[] = []
  const paths = new Set([...Object.keys(base), ...Object.keys(current), ...Object.keys(incoming)])

  paths.forEach((path) => {
    const original = base[path]
    const ours = current[path]
    const theirs = incoming[path]
    if (ours === theirs) {
      if (ours !== undefined) files[path] = ours
    } else if (ours === original) {
      if (theirs !== undefined) files[path] = theirs
    } else if (theirs === original) {
      if (ours !== undefined) files[path] = ours
    } else {
      conflicts.push(path)
      files[path] = `<<<<<<< current\n${ours ?? ''}\n=======\n${theirs ?? ''}\n>>>>>>> incoming\n`
    }
  })

  return { files, conflicts }
}

export function createTextDiff(before = '', after = '') {
  if (before === after) return 'No differences.'
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')
  const lines: string[] = []
  const length = Math.max(beforeLines.length, afterLines.length)
  for (let index = 0; index < length; index += 1) {
    if (beforeLines[index] === afterLines[index]) {
      if (beforeLines[index] !== undefined) lines.push(`  ${beforeLines[index]}`)
      continue
    }
    if (beforeLines[index] !== undefined) lines.push(`- ${beforeLines[index]}`)
    if (afterLines[index] !== undefined) lines.push(`+ ${afterLines[index]}`)
  }
  return lines.join('\n')
}
