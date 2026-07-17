import Editor from '@monaco-editor/react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bookmark, CheckCircle2, Copy, Download, Maximize2, Minimize2, RotateCcw, Save, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { useAuth } from '../../../../auth/authContext'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { Modal } from '../../../../components/ui/Modal'
import { isFirebaseConfigured } from '../../../../firebase/config'
import { firebaseSnippetRepository } from '../../../../firebase/snippetRepository'
import { clipboardService } from '../../../../services/clipboardService'
import { downloadTextFile } from '../../../../services/downloadService'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'
import { addNotification } from '../../../../store/slices/notificationSlice'
import { cn } from '../../../../utilities/cn'

const exampleJson = `{
  "name": "ToolStack",
  "version": 3,
  "features": ["format", "validate", "minify"],
  "settings": {
    "theme": "dark",
    "localProcessing": true
  }
}`

const PENDING_SAVE_KEY = 'toolstack.pendingJsonSave'
const OPEN_SNIPPET_KEY = 'toolstack.openJsonSnippet'
const DRAFT_INPUT_KEY = 'toolstack.jsonFormatter.input'
const DRAFT_OUTPUT_KEY = 'toolstack.jsonFormatter.output'

export function JsonFormatterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationIntent = (location.state as { intent?: 'save-json' | 'open-snippet' } | null)?.intent
  const initialJson = navigationIntent === 'save-json'
    ? sessionStorage.getItem(PENDING_SAVE_KEY)
    : navigationIntent === 'open-snippet'
      ? sessionStorage.getItem(OPEN_SNIPPET_KEY)
      : null
  const [input, setInput] = useState(initialJson ?? sessionStorage.getItem(DRAFT_INPUT_KEY) ?? '')
  const [output, setOutput] = useState(
    navigationIntent === 'open-snippet'
      ? initialJson ?? ''
      : sessionStorage.getItem(DRAFT_OUTPUT_KEY) ?? '',
  )
  const [inputWidth, setInputWidth] = useState(50)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(navigationIntent === 'save-json' && Boolean(initialJson))
  const [snippetTitle, setSnippetTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedJsonOwnerId, setSavedJsonOwnerId] = useState<string>()
  const [isExpanded, setIsExpanded] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const editorTheme = useAppSelector((state) => state.theme.editorTheme)
  const editorPreferences = useAppSelector((state) => state.editor)
  const { user } = useAuth()
  const isLightTheme = editorTheme === 'vs-light'

  const validation = useMemo(() => {
    if (!input.trim()) return { state: 'idle' as const, message: 'Start typing to validate your JSON.' }
    try {
      const parsed = JSON.parse(input) as unknown
      const root = Array.isArray(parsed) ? 'array' : parsed === null ? 'null' : typeof parsed
      return { state: 'valid' as const, message: `Valid JSON · ${root} root · ${new Blob([input]).size} bytes` }
    } catch (error) {
      return { state: 'invalid' as const, message: error instanceof Error ? error.message : 'Invalid JSON syntax.' }
    }
  }, [input])

  const processJson = useCallback((compact = false) => {
    if (!input.trim()) return
    try {
      setOutput(JSON.stringify(JSON.parse(input), null, compact ? 0 : 2))
    } catch { /* Live validation already displays the syntax error. */ }
  }, [input])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        processJson()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [processJson])

  useEffect(() => {
    if (!navigationIntent) return
    if (navigationIntent === 'open-snippet') sessionStorage.removeItem(OPEN_SNIPPET_KEY)
    navigate(location.pathname, { replace: true })
  }, [location.pathname, navigate, navigationIntent])

  useEffect(() => {
    if (input) sessionStorage.setItem(DRAFT_INPUT_KEY, input)
    else sessionStorage.removeItem(DRAFT_INPUT_KEY)
  }, [input])

  useEffect(() => {
    if (output) sessionStorage.setItem(DRAFT_OUTPUT_KEY, output)
    else sessionStorage.removeItem(DRAFT_OUTPUT_KEY)
  }, [output])

  useEffect(() => {
    if (!user || !isFirebaseConfigured) return
    let isCancelled = false

    firebaseSnippetRepository.hasAny()
      .then((hasSavedJson) => {
        if (!isCancelled && hasSavedJson) setSavedJsonOwnerId(user.uid)
      })
      .catch(() => { /* The save action will surface Firebase configuration or permission errors. */ })

    return () => { isCancelled = true }
  }, [user])

  useEffect(() => {
    if (!isExpanded) return
    const previousOverflow = document.body.style.overflow

    function collapseOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsExpanded(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', collapseOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', collapseOnEscape)
    }
  }, [isExpanded])

  function reset() {
    sessionStorage.removeItem(DRAFT_INPUT_KEY)
    sessionStorage.removeItem(DRAFT_OUTPUT_KEY)
    setInput('')
    setOutput('')
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
    downloadTextFile('formatted.json', output)
    dispatch(addNotification('JSON output downloaded.', 'success'))
  }

  function beginSave() {
    if (validation.state !== 'valid') return

    if (!user) {
      sessionStorage.setItem(PENDING_SAVE_KEY, input)
      navigate('/login', {
        state: { returnTo: '/tools/json-formatter', intent: 'save-json' },
      })
      return
    }

    setIsSaveDialogOpen(true)
  }

  async function saveJson() {
    if (validation.state !== 'valid' || isSaving) return

    if (!user) {
      setIsSaveDialogOpen(false)
      beginSave()
      return
    }

    if (!isFirebaseConfigured) {
      dispatch(addNotification('Firebase is not configured. Add your values to .env.local.', 'error'))
      return
    }

    setIsSaving(true)
    try {
      const formattedJson = JSON.stringify(JSON.parse(input), null, 2)
      await firebaseSnippetRepository.save(snippetTitle.trim() || 'Untitled JSON', formattedJson)
      setSavedJsonOwnerId(user.uid)
      sessionStorage.removeItem(PENDING_SAVE_KEY)
      setOutput(formattedJson)
      setSnippetTitle('')
      setIsSaveDialogOpen(false)
      dispatch(addNotification('JSON saved to Firebase.', 'success'))
    } catch (error) {
      dispatch(addNotification(error instanceof Error ? error.message : 'Unable to save JSON.', 'error'))
    } finally {
      setIsSaving(false)
    }
  }

  function resizePanes(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !gridRef.current) return
    const bounds = gridRef.current.getBoundingClientRect()
    setInputWidth(Math.min(75, Math.max(25, ((event.clientX - bounds.left) / bounds.width) * 100)))
  }

  function editorOptions(readOnly = false) {
    return {
      automaticLayout: true,
      fontSize: editorPreferences.fontSize,
      minimap: { enabled: editorPreferences.minimap },
      wordWrap: editorPreferences.wordWrap ? ('on' as const) : ('off' as const),
      formatOnPaste: true,
      folding: true,
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      readOnly,
      scrollBeyondLastLine: false,
      padding: { top: 14, bottom: 14 },
    }
  }

  return (
    <section className={cn(
      'json-workspace -mt-[18px] -mb-5 grid min-h-[calc(100vh-90px)] w-full max-w-none gap-2.5 pb-1 max-[980px]:min-h-[calc(100vh-184px)]',
      isExpanded && 'json-workspace-expanded',
    )}>
      <div className={cn(
        'flex !min-h-8 items-center gap-2 rounded-lg border !px-3 !py-1 text-xs leading-tight transition-colors',
        validation.state === 'valid' && (isLightTheme ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'),
        validation.state === 'invalid' && (isLightTheme ? 'border-red-300 bg-red-50 text-red-700' : 'border-red-500/40 bg-red-500/10 text-red-300'),
        validation.state === 'idle' && (isLightTheme ? 'border-slate-300 bg-white text-slate-600' : 'border-slate-700 text-slate-400'),
      )} role="status">
        {validation.state === 'valid' ? <CheckCircle2 size={17} /> : validation.state === 'invalid' ? <TriangleAlert size={17} /> : <ShieldCheck size={17} />}
        <span>{validation.message}</span>
        <div className="ml-auto flex items-center gap-1">
          {user && savedJsonOwnerId === user.uid && (
            <Button className="!min-h-7 !px-2 !py-1" variant="ghost" onClick={() => navigate('/tools/json-formatter/saved-data')}>
              <Bookmark size={14} />Saved JSON
            </Button>
          )}
          <Button
            className="!min-h-7 !px-2 !py-1"
            variant="ghost"
            aria-label={isExpanded ? 'Exit expanded view' : 'Expand JSON workspace'}
            aria-pressed={isExpanded}
            title={isExpanded ? 'Exit expanded view (Esc)' : 'Expand JSON workspace'}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>

      <div
        ref={gridRef}
        className="utility-grid min-h-0 items-stretch !gap-px !grid-cols-[minmax(260px,var(--input-pane-width))_6px_minmax(260px,var(--output-pane-width))] max-[980px]:!grid-cols-1 max-[980px]:!gap-4"
        style={{
          '--input-pane-width': `calc(${inputWidth}% - 3px)`,
          '--output-pane-width': `calc(${100 - inputWidth}% - 3px)`,
        } as CSSProperties}
      >
        <section className="tool-panel grid h-full min-w-0 content-start grid-rows-[auto_auto_auto] !gap-2 !p-3">
          <div className="panel-header !min-h-7"><h2>JSON input</h2><Button className="!min-h-7 !px-2 !py-1" variant="ghost" onClick={() => setInput(exampleJson)}><Sparkles size={15} />Example</Button></div>
          <div className={cn('json-editor-shell h-[max(380px,calc(100vh-280px))] min-h-45 resize-y overflow-hidden rounded-xl border focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/10', isLightTheme ? 'border-slate-300 bg-white' : 'border-slate-700 bg-[#1e1e1e]')}>
            <Editor language="json" theme={editorTheme} value={input} onChange={(value) => setInput(value ?? '')} options={editorOptions()} />
          </div>
          <div className="utility-actions">
            <Button disabled={validation.state !== 'valid'} onClick={() => processJson(false)}>Format &amp; Validate</Button>
            <Button variant="secondary" disabled={validation.state !== 'valid'} onClick={() => processJson(true)}>Minify</Button>
            <Button variant="secondary" disabled={validation.state !== 'valid'} onClick={beginSave}><Save size={16} />Save</Button>
            <Button variant="ghost" onClick={reset}><RotateCcw size={16} />Reset</Button>
          </div>
        </section>

        <div className="pane-resizer" role="separator" aria-label="Resize input and output panels" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={75} aria-valuenow={Math.round(inputWidth)} tabIndex={0} onDoubleClick={() => setInputWidth(50)} onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setInputWidth((width) => Math.min(75, Math.max(25, width + (event.key === 'ArrowLeft' ? -5 : 5)))) } }} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={resizePanes}><span aria-hidden="true" /></div>

        <section className="tool-panel grid h-full min-w-0 content-start grid-rows-[auto_auto_auto] !gap-2 !p-3">
          <div className="panel-header !min-h-7 !justify-between">
            <Button className="!min-h-7 !px-2 !py-1" variant="secondary" aria-label="Copy output" title="Copy output" disabled={!output} onClick={() => void copyOutput()}><Copy size={15} /></Button>
            <h2 className="mx-1">Output</h2>
            <Button className="!min-h-7 !px-2 !py-1" variant="secondary" aria-label="Download output" title="Download output" disabled={!output} onClick={downloadOutput}><Download size={15} /></Button>
          </div>
          <div className={cn('json-editor-shell h-[max(380px,calc(100vh-280px))] min-h-45 resize-y overflow-hidden rounded-xl border focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/10', isLightTheme ? 'border-slate-300 bg-white' : 'border-slate-700 bg-[#1e1e1e]')}>
            <Editor language="json" theme={editorTheme} value={output} onChange={(value) => setOutput(value ?? '')} options={editorOptions()} />
          </div>
          <div className="min-h-10" aria-hidden="true" />
        </section>
      </div>

      <Modal isOpen={isSaveDialogOpen} title="Save JSON to your account" onClose={() => setIsSaveDialogOpen(false)}>
        <div className="grid gap-4">
          <p className="muted text-sm">This formatted JSON will be stored in your private Firebase workspace.</p>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Name</span>
            <Input
              autoFocus
              value={snippetTitle}
              placeholder="For example: API response"
              onChange={(event) => setSnippetTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void saveJson()
                }
              }}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
            <Button disabled={isSaving} onClick={() => void saveJson()}>{isSaving ? 'Saving…' : 'Save to cloud'}</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
