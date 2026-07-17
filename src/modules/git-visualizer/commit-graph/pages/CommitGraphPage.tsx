import { BranchSelector } from '../components/BranchSelector'
import { CommitList } from '../components/CommitList'
import { COMMIT_GRAPH_TITLE } from '../constants'
import { useCommitGraph } from '../hooks/useCommitGraph'

export function CommitGraphPage() {
  const graph = useCommitGraph()

  return (
    <section className="page-stack tool-workspace">
      <div className="section-heading">
        <p className="eyebrow">Git visualizer</p>
        <h1>{COMMIT_GRAPH_TITLE}</h1>
        <p className="muted">Explore commits, branches, and merge paths with hoverable nodes.</p>
      </div>
      <div className="git-grid">
        <section className="tool-panel">
          <div className="panel-header">
            <h2>Branch</h2>
            <BranchSelector branches={graph.branches} value={graph.branch} onChange={graph.setBranch} />
          </div>
          <svg className="commit-graph" viewBox="0 0 720 300" role="img" aria-label="Commit graph">
            <path d="M80 150 C180 150 210 70 310 70 S430 150 540 150 620 210 660 210" />
            <path className="commit-branch" d="M250 150 C330 150 340 230 430 230 S520 170 590 170" />
            {[
              [80, 150, 'Initial commit'],
              [210, 118, 'Add tool shell'],
              [310, 70, 'JSON formatter'],
              [430, 114, 'API playground'],
              [540, 150, 'Merge modules'],
              [660, 210, 'Polish UI'],
            ].map(([cx, cy, label]) => (
              <g className="commit-node" key={label}>
                <circle cx={cx} cy={cy} r="12" />
                <title>{`${label} • alex • ${String(label).slice(0, 7).toLowerCase()}`}</title>
              </g>
            ))}
          </svg>
        </section>
        <section className="tool-panel">
          <h2>Commits</h2>
          <CommitList commits={graph.commits} />
        </section>
      </div>
    </section>
  )
}
