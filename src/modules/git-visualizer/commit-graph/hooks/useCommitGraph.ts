import { useEffect, useMemo, useState } from 'react'
import { createExampleRepository } from '../constants'
import type { ConsoleEntry, GitRepository } from '../types'
import { createTextDiff, findMergeBase, getFileChanges, isAncestor, mergeSnapshots, snapshotsEqual } from '../utilities/repository'

const STORAGE_KEY = 'toolstack.gitSimulator.repository'

function loadRepository() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as GitRepository : createExampleRepository()
  } catch {
    return createExampleRepository()
  }
}

function shortHash() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 7)
}

function tokenize(command: string) {
  const values: string[] = []
  const matcher = /"([^"]*)"|'([^']*)'|([^\s]+)/g
  let match: RegExpExecArray | null
  while ((match = matcher.exec(command)) !== null) values.push(match[1] ?? match[2] ?? match[3])
  return values
}

export function useCommitGraph() {
  const [repository, setRepository] = useState<GitRepository>(loadRepository)
  const [past, setPast] = useState<GitRepository[]>([])
  const [future, setFuture] = useState<GitRepository[]>([])
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])

  const headHash = repository.branches[repository.headBranch]
  const headCommit = repository.commits[headHash]
  const commits = useMemo(() => Object.values(repository.commits).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [repository.commits])
  const branches = useMemo(() => Object.keys(repository.branches).sort(), [repository.branches])
  const changes = useMemo(() => getFileChanges(repository), [repository])
  const selectedCommit = repository.commits[repository.selectedHash] ?? headCommit

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repository))
  }, [repository])

  function recordConsole(command: string, output: string, kind: ConsoleEntry['kind'] = 'success') {
    setConsoleEntries((entries) => [
      ...entries.slice(-29),
      { id: crypto.randomUUID(), command, output, kind },
    ])
  }

  function apply(next: GitRepository, command: string, output: string, kind: ConsoleEntry['kind'] = 'success') {
    setPast((history) => [...history.slice(-39), repository])
    setFuture([])
    setRepository(next)
    recordConsole(command, output, kind)
  }

  function editFile(path: string, content: string) {
    setRepository((current) => ({
      ...current,
      workingTree: { ...current.workingTree, [path]: content },
    }))
  }

  function createFile(path: string) {
    const cleanPath = path.trim()
    if (!cleanPath) return recordConsole('new file', 'Enter a filename.', 'error')
    if (cleanPath in repository.workingTree) return recordConsole('new file', `${cleanPath} already exists.`, 'error')
    apply({ ...repository, workingTree: { ...repository.workingTree, [cleanPath]: '' } }, 'new file', `Created ${cleanPath}.`)
  }

  function deleteFile(path: string) {
    const workingTree = { ...repository.workingTree }
    delete workingTree[path]
    apply({ ...repository, workingTree }, `delete ${path}`, `Deleted ${path} from the working directory.`)
  }

  function stageFile(path: string) {
    const index = { ...repository.index }
    if (path in repository.workingTree) index[path] = repository.workingTree[path]
    else delete index[path]
    apply({
      ...repository,
      index,
      conflicts: repository.conflicts.filter((conflict) => conflict !== path),
    }, `git add ${path}`, `Staged ${path}.`)
  }

  function stageAll() {
    apply({ ...repository, index: { ...repository.workingTree }, conflicts: [] }, 'git add .', 'Staged all working-tree changes.')
  }

  function unstageFile(path: string) {
    const index = { ...repository.index }
    if (path in headCommit.files) index[path] = headCommit.files[path]
    else delete index[path]
    apply({ ...repository, index }, `git restore --staged ${path}`, `Unstaged ${path}.`)
  }

  function discardFile(path: string) {
    const workingTree = { ...repository.workingTree }
    if (path in repository.index) workingTree[path] = repository.index[path]
    else delete workingTree[path]
    apply({ ...repository, workingTree }, `git restore ${path}`, `Restored ${path}.`)
  }

  function commit(message: string, command = `git commit -m "${message}"`) {
    const cleanMessage = message.trim()
    if (!cleanMessage) return recordConsole(command, 'A commit message is required.', 'error')
    if (repository.conflicts.length) return recordConsole(command, 'Resolve and stage every conflicted file before committing.', 'error')
    if (snapshotsEqual(headCommit.files, repository.index) && !repository.mergeParent) {
      return recordConsole(command, 'Nothing to commit. Stage a file first.', 'error')
    }

    const hash = shortHash()
    const parentHashes = repository.mergeParent ? [headHash, repository.mergeParent] : [headHash]
    const nextCommit = {
      hash,
      message: cleanMessage,
      branch: repository.headBranch,
      author: 'ToolStack User',
      createdAt: new Date().toISOString(),
      parentHashes,
      files: { ...repository.index },
    }
    apply({
      ...repository,
      commits: { ...repository.commits, [hash]: nextCommit },
      branches: { ...repository.branches, [repository.headBranch]: hash },
      workingTree: { ...repository.index },
      selectedHash: hash,
      mergeParent: undefined,
      conflicts: [],
    }, command, `Created commit ${hash}: ${cleanMessage}`)
  }

  function createBranch(name: string) {
    const cleanName = name.trim()
    if (!cleanName) return recordConsole('git branch', branches.join('\n'), 'info')
    if (repository.branches[cleanName]) return recordConsole(`git branch ${cleanName}`, `Branch ${cleanName} already exists.`, 'error')
    apply({ ...repository, branches: { ...repository.branches, [cleanName]: headHash } }, `git branch ${cleanName}`, `Created branch ${cleanName} at ${headHash}.`)
  }

  function switchBranch(name: string, command = `git switch ${name}`) {
    const target = repository.branches[name]
    if (!target) return recordConsole(command, `Branch ${name} does not exist.`, 'error')
    if (!snapshotsEqual(repository.workingTree, repository.index) || !snapshotsEqual(repository.index, headCommit.files)) {
      return recordConsole(command, 'Commit, stage, or restore your changes before switching branches.', 'error')
    }
    const files = repository.commits[target].files
    apply({
      ...repository,
      headBranch: name,
      workingTree: { ...files },
      index: { ...files },
      selectedHash: target,
      mergeParent: undefined,
      conflicts: [],
    }, command, `Switched to branch ${name}.`)
  }

  function deleteBranch(name: string) {
    if (name === repository.headBranch) return recordConsole(`git branch -d ${name}`, 'Cannot delete the current branch.', 'error')
    if (!repository.branches[name]) return recordConsole(`git branch -d ${name}`, `Branch ${name} does not exist.`, 'error')
    const nextBranches = { ...repository.branches }
    delete nextBranches[name]
    apply({ ...repository, branches: nextBranches }, `git branch -d ${name}`, `Deleted branch ${name}.`)
  }

  function mergeBranch(name: string) {
    const incomingHash = repository.branches[name]
    const command = `git merge ${name}`
    if (!incomingHash) return recordConsole(command, `Branch ${name} does not exist.`, 'error')
    if (name === repository.headBranch) return recordConsole(command, 'Already up to date.', 'info')
    if (!snapshotsEqual(repository.workingTree, repository.index) || !snapshotsEqual(repository.index, headCommit.files)) {
      return recordConsole(command, 'Commit or restore your changes before merging.', 'error')
    }
    if (isAncestor(repository, incomingHash, headHash)) return recordConsole(command, 'Already up to date.', 'info')
    if (isAncestor(repository, headHash, incomingHash)) {
      const files = repository.commits[incomingHash].files
      return apply({
        ...repository,
        branches: { ...repository.branches, [repository.headBranch]: incomingHash },
        workingTree: { ...files },
        index: { ...files },
        selectedHash: incomingHash,
      }, command, `Fast-forwarded ${repository.headBranch} to ${name}.`)
    }

    const baseHash = findMergeBase(repository, headHash, incomingHash)
    const baseFiles = baseHash ? repository.commits[baseHash].files : {}
    const merged = mergeSnapshots(baseFiles, headCommit.files, repository.commits[incomingHash].files)
    if (merged.conflicts.length) {
      return apply({
        ...repository,
        workingTree: merged.files,
        mergeParent: incomingHash,
        conflicts: merged.conflicts,
      }, command, `Merge has conflicts in: ${merged.conflicts.join(', ')}. Edit and stage them, then commit.`, 'error')
    }

    const hash = shortHash()
    const mergeCommit = {
      hash,
      message: `Merge branch '${name}' into ${repository.headBranch}`,
      branch: repository.headBranch,
      author: 'ToolStack User',
      createdAt: new Date().toISOString(),
      parentHashes: [headHash, incomingHash],
      files: merged.files,
    }
    apply({
      ...repository,
      commits: { ...repository.commits, [hash]: mergeCommit },
      branches: { ...repository.branches, [repository.headBranch]: hash },
      workingTree: { ...merged.files },
      index: { ...merged.files },
      selectedHash: hash,
    }, command, `Created merge commit ${hash}.`)
  }

  function reset(mode: 'soft' | 'mixed' | 'hard') {
    const target = headCommit.parentHashes[0]
    const command = `git reset --${mode} HEAD~1`
    if (!target) return recordConsole(command, 'The root commit has no parent.', 'error')
    if (mode === 'hard' && !window.confirm('Discard the current commit and all working-tree changes?')) {
      return recordConsole(command, 'Hard reset cancelled.', 'info')
    }
    const targetFiles = repository.commits[target].files
    apply({
      ...repository,
      branches: { ...repository.branches, [repository.headBranch]: target },
      index: mode === 'soft' ? repository.index : { ...targetFiles },
      workingTree: mode === 'hard' ? { ...targetFiles } : repository.workingTree,
      selectedHash: target,
    }, command, `Moved ${repository.headBranch} to ${target} using --${mode}.`)
  }

  function revert(hash: string) {
    const target = repository.commits[hash]
    const parent = target?.parentHashes[0] ? repository.commits[target.parentHashes[0]] : undefined
    if (!target || !parent) return recordConsole(`git revert ${hash}`, 'Select a non-root commit to revert.', 'error')
    const files = { ...headCommit.files }
    const paths = new Set([...Object.keys(parent.files), ...Object.keys(target.files)])
    paths.forEach((path) => {
      if (parent.files[path] === target.files[path]) return
      if (parent.files[path] === undefined) delete files[path]
      else files[path] = parent.files[path]
    })
    const revertHash = shortHash()
    const revertCommit = {
      hash: revertHash,
      message: `Revert "${target.message}"`,
      branch: repository.headBranch,
      author: 'ToolStack User',
      createdAt: new Date().toISOString(),
      parentHashes: [headHash],
      files,
    }
    apply({
      ...repository,
      commits: { ...repository.commits, [revertHash]: revertCommit },
      branches: { ...repository.branches, [repository.headBranch]: revertHash },
      workingTree: { ...files },
      index: { ...files },
      selectedHash: revertHash,
    }, `git revert ${hash}`, `Created revert commit ${revertHash}.`)
  }

  function statusText() {
    const changed = changes.filter((change) => change.staged || change.unstaged)
    if (!changed.length) return `On branch ${repository.headBranch}\nnothing to commit, working tree clean`
    return [
      `On branch ${repository.headBranch}`,
      ...changed.map((change) => `${change.staged ? `staged ${change.staged}` : `unstaged ${change.unstaged}`}: ${change.path}`),
    ].join('\n')
  }

  function runCommand(command: string) {
    const args = tokenize(command.trim())
    if (!args.length) return
    if (args[0] !== 'git') return recordConsole(command, 'Commands must start with git.', 'error')
    const action = args[1]
    if (action === 'status') return recordConsole(command, statusText(), 'info')
    if (action === 'add') return args[2] === '.' ? stageAll() : args[2] ? stageFile(args[2]) : recordConsole(command, 'Specify a file or use git add .', 'error')
    if (action === 'commit') {
      const messageIndex = args.findIndex((value) => value === '-m')
      return commit(messageIndex >= 0 ? args[messageIndex + 1] ?? '' : '', command)
    }
    if (action === 'branch') {
      if (args[2] === '-d') return deleteBranch(args[3] ?? '')
      return createBranch(args[2] ?? '')
    }
    if (action === 'switch' || action === 'checkout') return switchBranch(args[2] ?? '', command)
    if (action === 'merge') return mergeBranch(args[2] ?? '')
    if (action === 'restore') return args[2] === '--staged' ? unstageFile(args[3] ?? '') : discardFile(args[2] ?? '')
    if (action === 'reset') {
      const mode = args.includes('--soft') ? 'soft' : args.includes('--hard') ? 'hard' : 'mixed'
      return reset(mode)
    }
    if (action === 'revert') return revert(args[2] ?? repository.selectedHash)
    if (action === 'log') return recordConsole(command, commits.map((item) => `${item.hash} ${item.message}`).join('\n'), 'info')
    if (action === 'diff') {
      const path = args[2] ?? changes[0]?.path
      if (!path) return recordConsole(command, 'No changed file to compare.', 'info')
      return recordConsole(command, createTextDiff(repository.index[path], repository.workingTree[path]), 'info')
    }
    return recordConsole(command, `Unsupported command: ${action ?? ''}`, 'error')
  }

  function undo() {
    const previous = past.at(-1)
    if (!previous) return
    setFuture((items) => [repository, ...items])
    setPast((items) => items.slice(0, -1))
    setRepository(previous)
    recordConsole('undo', 'Undid the previous repository operation.', 'info')
  }

  function redo() {
    const next = future[0]
    if (!next) return
    setPast((items) => [...items, repository])
    setFuture((items) => items.slice(1))
    setRepository(next)
    recordConsole('redo', 'Restored the next repository operation.', 'info')
  }

  function resetExample() {
    apply(createExampleRepository(), 'reset repository', 'Loaded the example repository.')
  }

  function importRepository(value: string) {
    try {
      const imported = JSON.parse(value) as GitRepository
      if (!imported.commits || !imported.branches || !imported.headBranch || !imported.workingTree || !imported.index) throw new Error('Missing repository fields.')
      apply(imported, 'import repository', 'Imported repository JSON.')
    } catch (error) {
      recordConsole('import repository', error instanceof Error ? error.message : 'Invalid repository JSON.', 'error')
    }
  }

  return {
    repository,
    commits,
    branches,
    changes,
    headHash,
    headCommit,
    selectedCommit,
    consoleEntries,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    setSelectedHash: (hash: string) => setRepository((current) => ({ ...current, selectedHash: hash })),
    editFile,
    createFile,
    deleteFile,
    stageFile,
    stageAll,
    unstageFile,
    discardFile,
    commit,
    createBranch,
    switchBranch,
    mergeBranch,
    reset,
    revert,
    runCommand,
    undo,
    redo,
    resetExample,
    importRepository,
    exportRepository: () => JSON.stringify(repository, null, 2),
    clearConsole: () => setConsoleEntries([]),
  }
}
