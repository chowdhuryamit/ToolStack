import { useMemo, useRef, useState } from 'react'
import { Download, FilePlus2, GitBranch, GitCommitHorizontal, GitMerge, Redo2, RotateCcw, Terminal, Trash2, Undo2, Upload } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { downloadTextFile } from '../../../../services/downloadService'
import { GraphCanvas } from '../components/GraphCanvas'
import { useCommitGraph } from '../hooks/useCommitGraph'
import { createTextDiff } from '../utilities/repository'

export function CommitGraphPage() {
  const graph = useCommitGraph()
  const [command, setCommand] = useState('git status')
  const [commitMessage, setCommitMessage] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState(Object.keys(graph.repository.workingTree)[0] ?? '')
  const [branchName, setBranchName] = useState('feature')
  const [switchTarget, setSwitchTarget] = useState(graph.repository.headBranch)
  const [mergeBranch, setMergeBranch] = useState('')
  const [commitSearch, setCommitSearch] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const selectedChange = graph.changes.find((change) => change.path === selectedFile)
  const filteredCommits = useMemo(() => {
    const search = commitSearch.trim().toLowerCase()
    if (!search) return graph.commits
    return graph.commits.filter((commit) => [commit.hash, commit.message, commit.author, commit.branch].some((value) => value.toLowerCase().includes(search)))
  }, [commitSearch, graph.commits])
  const diff = createTextDiff(graph.repository.index[selectedFile], graph.repository.workingTree[selectedFile])

  function submitCommand() {
    graph.runCommand(command)
    setCommand('')
  }

  function createNewFile() {
    const path = newFileName.trim()
    if (!path) return
    graph.createFile(path)
    setSelectedFile(path)
    setNewFileName('')
  }

  async function importFile(file?: File) {
    if (!file) return
    graph.importRepository(await file.text())
    if (importRef.current) importRef.current.value = ''
  }

  return (
    <section className="page-stack git-workspace">
      <section className="tool-panel git-command-panel">
        <div className="git-head-status">
          <span><GitBranch size={16} />HEAD → <strong>{graph.repository.headBranch}</strong></span>
          <code>{graph.headHash}</code>
          {graph.repository.conflicts.length > 0 && <span className="git-conflict-label">{graph.repository.conflicts.length} conflict(s)</span>}
        </div>
        <div className="git-command-row">
          <Terminal size={18} />
          <Input
            value={command}
            aria-label="Git command"
            placeholder='Try git status, git add ., or git commit -m "message"'
            onChange={(event) => setCommand(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') submitCommand() }}
          />
          <Button onClick={submitCommand}>Run</Button>
        </div>
        <div className="git-toolbar">
          <Button variant="secondary" disabled={!graph.canUndo} onClick={graph.undo}><Undo2 size={15} />Undo</Button>
          <Button variant="secondary" disabled={!graph.canRedo} onClick={graph.redo}><Redo2 size={15} />Redo</Button>
          <Button variant="secondary" onClick={graph.resetExample}><RotateCcw size={15} />Example repository</Button>
          <Button variant="secondary" onClick={() => downloadTextFile('toolstack-git-repository.json', graph.exportRepository())}><Download size={15} />Export</Button>
          <Button variant="secondary" onClick={() => importRef.current?.click()}><Upload size={15} />Import</Button>
          <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} />
          <span className="git-local-note">Simulated locally—your real repositories are never modified.</span>
        </div>
      </section>

      <div className="git-workspace-grid">
        <section className="tool-panel git-files-panel">
          <div className="panel-header"><h2>Files and staging</h2><Button variant="secondary" onClick={graph.stageAll}>Stage all</Button></div>
          <div className="git-new-file-row">
            <Input value={newFileName} placeholder="src/new-file.ts" onChange={(event) => setNewFileName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') createNewFile() }} />
            <Button variant="secondary" onClick={createNewFile}><FilePlus2 size={15} />New file</Button>
          </div>
          <div className="git-file-list">
            {graph.changes.map((change) => (
              <div className={`git-file-row ${selectedFile === change.path ? 'git-file-row-selected' : ''}`} key={change.path}>
                <button type="button" onClick={() => setSelectedFile(change.path)}>
                  <span>{change.path}</span>
                  <small className={change.conflicted ? 'git-file-conflict' : ''}>
                    {change.conflicted ? 'conflict' : change.staged ? `staged ${change.staged}` : change.unstaged ? change.unstaged : 'clean'}
                  </small>
                </button>
                <div>
                  {change.unstaged && <Button variant="secondary" onClick={() => graph.stageFile(change.path)}>Stage</Button>}
                  {change.staged && <Button variant="ghost" onClick={() => graph.unstageFile(change.path)}>Unstage</Button>}
                  {change.unstaged && <Button variant="ghost" onClick={() => graph.discardFile(change.path)}>Restore</Button>}
                  {change.path in graph.repository.workingTree && <Button variant="ghost" aria-label={`Delete ${change.path}`} onClick={() => graph.deleteFile(change.path)}><Trash2 size={14} /></Button>}
                </div>
              </div>
            ))}
          </div>

          <label className="git-field-label" htmlFor="git-file-editor">Working file: {selectedFile || 'none selected'}</label>
          <textarea
            id="git-file-editor"
            className="git-file-editor"
            disabled={!selectedFile || !(selectedFile in graph.repository.workingTree)}
            value={graph.repository.workingTree[selectedFile] ?? ''}
            placeholder="Select or create a file to edit it."
            onChange={(event) => graph.editFile(selectedFile, event.target.value)}
            spellCheck={false}
          />

          <div className="git-commit-row-actions">
            <Input value={commitMessage} placeholder="Commit message" onChange={(event) => setCommitMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { graph.commit(commitMessage); setCommitMessage('') } }} />
            <Button onClick={() => { graph.commit(commitMessage); setCommitMessage('') }}><GitCommitHorizontal size={16} />Commit staged</Button>
          </div>
        </section>

        <section className="tool-panel git-graph-panel">
          <div className="panel-header">
            <h2>Commit graph</h2>
            <Input className="git-search-input" value={commitSearch} placeholder="Filter commits…" onChange={(event) => setCommitSearch(event.target.value)} />
          </div>
          <GraphCanvas commits={filteredCommits} branches={graph.repository.branches} headBranch={graph.repository.headBranch} selectedHash={graph.repository.selectedHash} onSelect={graph.setSelectedHash} />
          <div className="git-branch-controls">
            <div><Input value={branchName} placeholder="Branch name" onChange={(event) => setBranchName(event.target.value)} /><Button variant="secondary" onClick={() => graph.createBranch(branchName)}>Create branch</Button></div>
            <div>
              <select className="input" value={switchTarget} onChange={(event) => setSwitchTarget(event.target.value)}>{graph.branches.map((branch) => <option key={branch}>{branch}</option>)}</select>
              <Button variant="secondary" onClick={() => graph.switchBranch(switchTarget)}>Switch</Button>
            </div>
            <div>
              <select className="input" value={mergeBranch} onChange={(event) => setMergeBranch(event.target.value)}><option value="">Select branch to merge</option>{graph.branches.filter((branch) => branch !== graph.repository.headBranch).map((branch) => <option key={branch}>{branch}</option>)}</select>
              <Button variant="secondary" disabled={!mergeBranch} onClick={() => graph.mergeBranch(mergeBranch)}><GitMerge size={15} />Merge</Button>
            </div>
          </div>
        </section>
      </div>

      <div className="git-details-grid">
        <section className="tool-panel git-diff-panel">
          <div className="panel-header"><h2>Working-tree diff</h2><span>{selectedChange?.unstaged ?? 'clean'}</span></div>
          <pre className="git-diff-output">{diff}</pre>
        </section>

        <section className="tool-panel git-commit-details">
          <div className="panel-header"><h2>Selected commit</h2><Button variant="secondary" onClick={() => graph.revert(graph.selectedCommit.hash)}>Revert</Button></div>
          <dl>
            <div><dt>Hash</dt><dd><code>{graph.selectedCommit.hash}</code></dd></div>
            <div><dt>Message</dt><dd>{graph.selectedCommit.message}</dd></div>
            <div><dt>Author</dt><dd>{graph.selectedCommit.author}</dd></div>
            <div><dt>Branch</dt><dd>{graph.selectedCommit.branch}</dd></div>
            <div><dt>Parents</dt><dd>{graph.selectedCommit.parentHashes.join(', ') || 'Root commit'}</dd></div>
            <div><dt>Created</dt><dd>{new Date(graph.selectedCommit.createdAt).toLocaleString()}</dd></div>
            <div><dt>Files</dt><dd>{Object.keys(graph.selectedCommit.files).join(', ') || 'No files'}</dd></div>
          </dl>
        </section>

        <section className="tool-panel git-console-panel">
          <div className="panel-header"><h2>Command output</h2><Button variant="ghost" onClick={graph.clearConsole}>Clear</Button></div>
          <div className="git-console-output">
            {graph.consoleEntries.length === 0 && <p>Run <code>git status</code> to begin.</p>}
            {graph.consoleEntries.map((entry) => <div className={`git-console-entry git-console-${entry.kind}`} key={entry.id}><code>$ {entry.command}</code><pre>{entry.output}</pre></div>)}
          </div>
        </section>
      </div>
    </section>
  )
}
