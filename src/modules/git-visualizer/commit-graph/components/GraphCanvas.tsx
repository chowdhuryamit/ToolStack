import type { CSSProperties } from 'react'
import type { CommitNode } from '../types'

type GraphCanvasProps = {
  commits: CommitNode[]
  branches: Record<string, string>
  headBranch: string
  selectedHash: string
  onSelect: (hash: string) => void
}

const laneColors = ['#4cb65b', '#4d90dd', '#ba8f3e', '#a17bdd', '#cd7073', '#4cb7c1']

export function GraphCanvas({ commits, branches, headBranch, selectedHash, onSelect }: GraphCanvasProps) {
  const lanes = [...new Set([...Object.keys(branches), ...commits.map((commit) => commit.branch)])]
  const positions = new Map(commits.map((commit, index) => [commit.hash, {
    x: 48 + Math.max(0, lanes.indexOf(commit.branch)) * 54,
    y: 38 + index * 66,
  }]))
  const width = Math.max(620, 300 + lanes.length * 54)
  const height = Math.max(180, commits.length * 66 + 28)

  return (
    <div className="git-graph-scroll">
      <svg className="git-graph-canvas" viewBox={`0 0 ${width} ${height}`} height={height} role="img" aria-label="Interactive commit graph">
        {commits.flatMap((commit) => commit.parentHashes.map((parentHash) => {
          const from = positions.get(commit.hash)
          const to = positions.get(parentHash)
          if (!from || !to) return null
          return <path key={`${commit.hash}-${parentHash}`} d={`M ${from.x} ${from.y} C ${from.x} ${from.y + 28}, ${to.x} ${to.y - 28}, ${to.x} ${to.y}`} />
        }))}
        {commits.map((commit) => {
          const position = positions.get(commit.hash)
          if (!position) return null
          const branchLabels = Object.entries(branches).filter(([, hash]) => hash === commit.hash).map(([name]) => name)
          const color = laneColors[Math.max(0, lanes.indexOf(commit.branch)) % laneColors.length]
          return (
            <g
              className={`git-graph-node ${selectedHash === commit.hash ? 'git-graph-node-selected' : ''}`}
              key={commit.hash}
              role="button"
              tabIndex={0}
              aria-label={`Select commit ${commit.hash}: ${commit.message}`}
              onClick={() => onSelect(commit.hash)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(commit.hash) }}
            >
              <circle cx={position.x} cy={position.y} r="10" style={{ '--commit-color': color } as CSSProperties} />
              <text className="git-graph-message" x={position.x + 22} y={position.y - 4}>{commit.message}</text>
              <text className="git-graph-meta" x={position.x + 22} y={position.y + 15}>{commit.hash} · {commit.author}</text>
              {branchLabels.map((name, index) => (
                <g key={name} transform={`translate(${position.x + 245 + index * 92} ${position.y - 15})`}>
                  <rect width="84" height="24" rx="12" />
                  <text x="42" y="16" textAnchor="middle">{name === headBranch ? `HEAD → ${name}` : name}</text>
                </g>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
