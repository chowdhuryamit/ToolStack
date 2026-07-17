import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { CheckCircle2, Copy, Download, Keyboard, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { clipboardService } from '../../../services/clipboardService'
import { downloadTextFile } from '../../../services/downloadService'
import { useAppDispatch } from '../../../store/hooks'
import { addNotification } from '../../../store/slices/notificationSlice'

type Processor = (input: string, secondary: string) => string | Promise<string>

export type ToolAction = {
  label: string
  process: Processor
}

export type DeveloperToolConfig = {
  title: string
  description: string
  inputLabel?: string
  outputLabel?: string
  placeholder?: string
  example: string
  secondary?: { label: string; placeholder: string; example: string }
  actions: ToolAction[]
  filename: string
}

export function DeveloperToolPage({ config }: { config: DeveloperToolConfig }) {
  const [input, setInput] = useState('')
  const [secondary, setSecondary] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [inputWidth, setInputWidth] = useState(50)
  const gridRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()

  const run = useCallback(async (action = config.actions[0]) => {
    setBusy(true)
    setError('')
    try {
      const result = await action.process(input, secondary)
      setOutput(result)
    } catch (reason) {
      setOutput('')
      setError(reason instanceof Error ? reason.message : 'Unable to process this input.')
    } finally {
      setBusy(false)
    }
  }, [config.actions, input, secondary])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        void run()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [run])

  function reset() {
    setInput('')
    setSecondary('')
    setOutput('')
    setError('')
  }

  function loadExample() {
    setInput(config.example)
    setSecondary(config.secondary?.example ?? '')
    setOutput('')
    setError('')
  }

  function resizePanes(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !gridRef.current) return
    const bounds = gridRef.current.getBoundingClientRect()
    const percentage = ((event.clientX - bounds.left) / bounds.width) * 100
    setInputWidth(Math.min(75, Math.max(25, percentage)))
  }

  function resizeWithKeyboard(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setInputWidth((width) => Math.min(75, Math.max(25, width + (event.key === 'ArrowLeft' ? -5 : 5))))
  }

  async function copyOutput() {
    try {
      await clipboardService.copy(output)
      dispatch(addNotification('Output copied to clipboard.', 'success'))
    } catch {
      dispatch(addNotification('Unable to copy the output.', 'error'))
    }
  }

  function downloadOutput() {
    downloadTextFile(config.filename, output)
    dispatch(addNotification('Output downloaded.', 'success'))
  }

  return (
    <section className="page-stack tool-workspace utility-workspace">
      <div className="utility-heading">
        <div className="section-heading">
          <p className="eyebrow">Developer tools</p>
          <h1>{config.title}</h1>
          <p className="muted">{config.description}</p>
        </div>
        <div className="local-notice"><ShieldCheck size={16} /><span>Processed locally in your browser</span></div>
      </div>

      {error && <div className="validation-message validation-error" role="alert"><strong>Check your input</strong><span>{error}</span></div>}
      {!error && output && <div className="validation-message validation-success"><CheckCircle2 size={17} /><span>Output generated successfully.</span></div>}

      <div ref={gridRef} className="utility-grid" style={{ '--input-pane-width': `${inputWidth}%` } as CSSProperties}>
        <section className="tool-panel utility-panel">
          <div className="panel-header">
            <h2>{config.inputLabel ?? 'Input'}</h2>
            <Button variant="ghost" onClick={loadExample}><Sparkles size={16} />Example</Button>
          </div>
          <textarea className="utility-textarea" value={input} onChange={(event) => setInput(event.target.value)} placeholder={config.placeholder ?? 'Paste or type your input…'} spellCheck={false} />
          {config.secondary && <>
            <label className="utility-label" htmlFor="secondary-input">{config.secondary.label}</label>
            <textarea id="secondary-input" className="utility-textarea utility-textarea-secondary" value={secondary} onChange={(event) => setSecondary(event.target.value)} placeholder={config.secondary.placeholder} spellCheck={false} />
          </>}
          <div className="utility-actions">
            {config.actions.map((action, index) => <Button key={action.label} variant={index === 0 ? 'primary' : 'secondary'} disabled={busy} onClick={() => void run(action)}>{action.label}</Button>)}
            <Button variant="ghost" onClick={reset}><RotateCcw size={16} />Reset</Button>
            <span className="shortcut-hint"><Keyboard size={14} />Ctrl/⌘ + Enter</span>
          </div>
        </section>


        <div
          className="pane-resizer"
          role="separator"
          aria-label="Resize input and output panels"
          aria-orientation="vertical"
          aria-valuemin={25}
          aria-valuemax={75}
          aria-valuenow={Math.round(inputWidth)}
          tabIndex={0}
          onDoubleClick={() => setInputWidth(50)}
          onKeyDown={resizeWithKeyboard}
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={resizePanes}
        >
          <span aria-hidden="true" />
        </div>

        <section className="tool-panel utility-panel utility-output-panel">
          <div className="panel-header">
            <h2>{config.outputLabel ?? 'Output'}</h2>
            <div className="output-actions">
              <Button variant="secondary" disabled={!output} onClick={() => void copyOutput()}><Copy size={16} />Copy</Button>
              <Button variant="secondary" disabled={!output} onClick={downloadOutput}><Download size={16} />Download</Button>
            </div>
          </div>
          <pre className={`utility-output ${output ? '' : 'utility-output-empty'}`}>{output || 'Your processed output will appear here.'}</pre>
        </section>
      </div>
    </section>
  )
}

export function ConfiguredDeveloperTool({ config }: { config: DeveloperToolConfig }) {
  const stableConfig = useMemo(() => config, [config])
  return <DeveloperToolPage config={stableConfig} />
}
