import { SandboxConsole } from '../components/SandboxConsole'
import { SandboxEditor } from '../components/SandboxEditor'
import { SandboxPreview } from '../components/SandboxPreview'
import { SandboxToolbar } from '../components/SandboxToolbar'
import { REACT_SANDBOX_TITLE } from '../constants'
import { useReactSandbox } from '../hooks/useReactSandbox'

export function ReactSandboxPage() {
  const sandbox = useReactSandbox()

  return (
    <section className="page-stack tool-workspace">
      <div className="section-heading">
        <p className="eyebrow">React playground</p>
        <h1>{REACT_SANDBOX_TITLE}</h1>
        <p className="muted">Edit, preview, and inspect console output in a three-pane sandbox.</p>
      </div>
      <SandboxToolbar onRun={sandbox.run} />
      <div className="playground-grid">
        <section className="tool-panel code-pane">
          <div className="panel-header">
            <h2>Editor</h2>
            <span className="card-meta">TSX</span>
          </div>
          <SandboxEditor code={sandbox.code} onChange={sandbox.setCode} />
        </section>
        <section className="tool-panel preview-pane">
          <div className="panel-header">
            <h2>Preview</h2>
            <span className="status-pill status-online"><span />Live</span>
          </div>
          <SandboxPreview preview={sandbox.preview} />
        </section>
        <section className="tool-panel console-pane">
          <div className="panel-header">
            <h2>Console</h2>
            <span className="card-meta">collapsible</span>
          </div>
          <SandboxConsole logs={sandbox.logs} />
        </section>
      </div>
    </section>
  )
}
