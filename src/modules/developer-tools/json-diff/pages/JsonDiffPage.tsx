import { DiffEditor, type DiffOnMount } from '@monaco-editor/react'
import { ArrowLeftRight, Bookmark, CheckCircle2, GitCompareArrows, Maximize2, Minimize2, RotateCcw, Save, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../auth/authContext'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { Modal } from '../../../../components/ui/Modal'
import { ThemeToggle } from '../../../../components/ui/ThemeToggle'
import { isFirebaseConfigured } from '../../../../firebase/config'
import { firebaseSnippetRepository } from '../../../../firebase/snippetRepository'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'
import { addNotification } from '../../../../store/slices/notificationSlice'
import { cn } from '../../../../utilities/cn'

const ORIGINAL_DRAFT_KEY = 'toolstack.jsonDiff.original'
const MODIFIED_DRAFT_KEY = 'toolstack.jsonDiff.modified'
const EDITOR_SURFACE_THEME_KEY = 'toolstack.jsonFormatter.editorTheme'

const originalExample = `{
  "name": "ToolStack",
  "version": 2,
  "features": ["format", "validate", "minify"],
  "settings": {
    "theme": "dark",
    "autosave": false
  }
}`

const modifiedExample = `{
  "name": "ToolStack",
  "version": 3,
  "features": ["format", "validate", "diff"],
  "settings": {
    "theme": "dark",
    "autosave": true
  },
  "status": "active"
}`

type JsonValidation = {
  state: 'idle' | 'invalid' | 'identical' | 'changed'
  message: string
  original?: unknown
  modified?: unknown
}

function countJsonChanges(original: unknown, modified: unknown): number {
  if (Object.is(original, modified)) return 0
  if (typeof original !== 'object' || original === null || typeof modified !== 'object' || modified === null) return 1

  const left = original as Record<string, unknown>
  const right = modified as Record<string, unknown>

  return [...new Set([...Object.keys(left), ...Object.keys(right)])].reduce((total, key) => {
    if (!(key in left) || !(key in right)) return total + 1
    return total + countJsonChanges(left[key], right[key])
  }, 0)
}

export function JsonDiffPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationIntent = (location.state as { intent?: 'save-json-diff' } | null)?.intent
  const [original, setOriginal] = useState(() => sessionStorage.getItem(ORIGINAL_DRAFT_KEY) ?? '')
  const [modified, setModified] = useState(() => sessionStorage.getItem(MODIFIED_DRAFT_KEY) ?? '')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(navigationIntent === 'save-json-diff')
  const [comparisonTitle, setComparisonTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasSavedComparisons, setHasSavedComparisons] = useState(false)
  const [editorSurfaceTheme, setEditorSurfaceTheme] = useState<'dark' | 'light'>(() => (
    localStorage.getItem(EDITOR_SURFACE_THEME_KEY) === 'light' ? 'light' : 'dark'
  ))
  const modelSubscriptions = useRef<Array<{ dispose: () => void }>>([])
  const dispatch = useAppDispatch()
  const editorTheme = useAppSelector((state) => state.theme.editorTheme)
  const editorPreferences = useAppSelector((state) => state.editor)
  const { user } = useAuth()
  const isAppLightTheme = editorTheme === 'vs-light'
  const isEditorSurfaceLight = editorSurfaceTheme === 'light'

  const validation = useMemo<JsonValidation>(() => {
    if (!original.trim() && !modified.trim()) {
      return { state: 'idle', message: 'Enter two JSON documents to compare them.' }
    }
    if (!original.trim() || !modified.trim()) {
      return { state: 'invalid', message: `Add ${original.trim() ? 'the changed' : 'the original'} JSON to start comparing.` }
    }

    let parsedOriginal: unknown
    let parsedModified: unknown
    try {
      parsedOriginal = JSON.parse(original) as unknown
    } catch (error) {
      return { state: 'invalid', message: `Original JSON: ${error instanceof Error ? error.message : 'Invalid JSON syntax.'}` }
    }
    try {
      parsedModified = JSON.parse(modified) as unknown
    } catch (error) {
      return { state: 'invalid', message: `Changed JSON: ${error instanceof Error ? error.message : 'Invalid JSON syntax.'}` }
    }

    const changeCount = countJsonChanges(parsedOriginal, parsedModified)
    if (changeCount === 0) {
      return { state: 'identical', message: 'Both JSON documents contain the same data.', original: parsedOriginal, modified: parsedModified }
    }
    return {
      state: 'changed',
      message: `${changeCount} ${changeCount === 1 ? 'difference' : 'differences'} found · highlighted in the editors.`,
      original: parsedOriginal,
      modified: parsedModified,
    }
  }, [modified, original])

  const formatAndCompare = useCallback(() => {
    if (validation.state === 'invalid' || validation.state === 'idle') return
    setOriginal(JSON.stringify(validation.original, null, 2))
    setModified(JSON.stringify(validation.modified, null, 2))
  }, [validation])

  useEffect(() => {
    if (!navigationIntent) return
    navigate(location.pathname, { replace: true })
  }, [location.pathname, navigate, navigationIntent])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        formatAndCompare()
      }
      if (event.key === 'Escape' && isExpanded) setIsExpanded(false)
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [formatAndCompare, isExpanded])

  useEffect(() => {
    if (original) sessionStorage.setItem(ORIGINAL_DRAFT_KEY, original)
    else sessionStorage.removeItem(ORIGINAL_DRAFT_KEY)
  }, [original])

  useEffect(() => {
    if (modified) sessionStorage.setItem(MODIFIED_DRAFT_KEY, modified)
    else sessionStorage.removeItem(MODIFIED_DRAFT_KEY)
  }, [modified])

  useEffect(() => {
    localStorage.setItem(EDITOR_SURFACE_THEME_KEY, editorSurfaceTheme)
  }, [editorSurfaceTheme])

  useEffect(() => {
    if (!user || !isFirebaseConfigured) return
    let isCancelled = false
    firebaseSnippetRepository.hasAnyDiff()
      .then((hasAnyDiff) => {
        if (!isCancelled) setHasSavedComparisons(hasAnyDiff)
      })
      .catch(() => { /* The save and saved-data actions surface errors when used. */ })
    return () => { isCancelled = true }
  }, [user])

  useEffect(() => {
    if (!isExpanded) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [isExpanded])

  useEffect(() => () => {
    modelSubscriptions.current.forEach((subscription) => subscription.dispose())
  }, [])

  const handleEditorMount: DiffOnMount = (editor) => {
    modelSubscriptions.current.forEach((subscription) => subscription.dispose())
    const originalModel = editor.getOriginalEditor().getModel()
    const modifiedModel = editor.getModifiedEditor().getModel()
    modelSubscriptions.current = [
      originalModel?.onDidChangeContent(() => setOriginal(originalModel.getValue())),
      modifiedModel?.onDidChangeContent(() => setModified(modifiedModel.getValue())),
    ].filter((subscription): subscription is { dispose: () => void } => Boolean(subscription))
  }

  function loadExample() {
    setOriginal(originalExample)
    setModified(modifiedExample)
  }

  function reset() {
    setOriginal('')
    setModified('')
    sessionStorage.removeItem(ORIGINAL_DRAFT_KEY)
    sessionStorage.removeItem(MODIFIED_DRAFT_KEY)
  }

  function swapDocuments() {
    setOriginal(modified)
    setModified(original)
  }

  function beginSave() {
    if (validation.state === 'invalid' || validation.state === 'idle') return
    if (!user) {
      navigate('/login', {
        state: { returnTo: '/tools/json-diff', intent: 'save-json-diff' },
      })
      return
    }
    setIsSaveDialogOpen(true)
  }

  async function saveComparison() {
    if (validation.state === 'invalid' || validation.state === 'idle' || isSaving) return
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
      const formattedOriginal = JSON.stringify(validation.original, null, 2)
      const formattedModified = JSON.stringify(validation.modified, null, 2)
      await firebaseSnippetRepository.saveDiff(comparisonTitle.trim() || 'Untitled JSON comparison', formattedOriginal, formattedModified)
      setOriginal(formattedOriginal)
      setModified(formattedModified)
      setHasSavedComparisons(true)
      setComparisonTitle('')
      setIsSaveDialogOpen(false)
      dispatch(addNotification('JSON comparison saved to Firebase.', 'success'))
    } catch (error) {
      dispatch(addNotification(error instanceof Error ? error.message : 'Unable to save the JSON comparison.', 'error'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className={cn(
      'json-workspace -mt-[18px] -mb-5 grid min-h-[calc(100vh-90px)] w-full max-w-none grid-rows-[auto_minmax(0,1fr)] content-start gap-2.5 pb-1 max-[980px]:min-h-[calc(100vh-184px)]',
      isExpanded && 'json-workspace-expanded',
    )}>
      <div className="flex min-w-0 items-center gap-2.5 max-[640px]:items-start">
        <ThemeToggle
          isLight={isEditorSurfaceLight}
          label="JSON diff editor theme"
          onChange={(isLight) => setEditorSurfaceTheme(isLight ? 'light' : 'dark')}
        />
        <div className={cn(
          'flex min-h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-1 text-xs leading-tight transition-colors',
          validation.state === 'changed' && (isAppLightTheme ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-sky-500/30 bg-sky-500/10 text-sky-300'),
          validation.state === 'identical' && (isAppLightTheme ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'),
          validation.state === 'invalid' && (isAppLightTheme ? 'border-red-300 bg-red-50 text-red-700' : 'border-red-500/40 bg-red-500/10 text-red-300'),
          validation.state === 'idle' && (isAppLightTheme ? 'border-slate-300 bg-white text-slate-600' : 'border-slate-700 text-slate-400'),
        )} role="status">
          {validation.state === 'changed' ? <GitCompareArrows className="shrink-0" size={17} /> : validation.state === 'identical' ? <CheckCircle2 className="shrink-0" size={17} /> : validation.state === 'invalid' ? <TriangleAlert className="shrink-0" size={17} /> : <ShieldCheck className="shrink-0" size={17} />}
          <span className="min-w-0 truncate">{validation.message}</span>
          <div className="relative z-1 ml-auto flex shrink-0 items-center gap-1">
            {user && hasSavedComparisons && (
              <Button className="!min-h-7 !px-2 !py-1" variant="ghost" onClick={() => navigate('/tools/json-diff/saved-data')}>
                <Bookmark size={14} />Saved comparisons
              </Button>
            )}
            <Button
              className="!min-h-7 !px-2 !py-1"
              variant="ghost"
              aria-label={isExpanded ? 'Exit expanded view' : 'Expand JSON diff workspace'}
              aria-pressed={isExpanded}
              title={isExpanded ? 'Exit expanded view (Esc)' : 'Expand JSON diff workspace'}
              onClick={() => setIsExpanded((expanded) => !expanded)}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </div>

      <section className="tool-panel grid h-full min-h-0 grid-rows-[auto_minmax(380px,1fr)_auto] !gap-2 !p-3">
        <div className="grid grid-cols-2 gap-6 max-[700px]:gap-3">
          <div className="panel-header !min-h-7"><h2>Original JSON</h2></div>
          <div className="panel-header !min-h-7">
            <h2>Changed JSON</h2>
            <Button className="!min-h-7 !px-2 !py-1" variant="ghost" onClick={loadExample}><Sparkles size={15} />Example</Button>
          </div>
        </div>

        <div className={cn(
          'json-editor-shell !h-full min-h-[380px] resize-y overflow-hidden rounded-xl border focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/10',
          isEditorSurfaceLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-[#1e1e1e]',
        )}>
          <DiffEditor
            height="100%"
            language="json"
            original={original}
            modified={modified}
            theme={isEditorSurfaceLight ? 'vs-light' : 'vs-dark'}
            onMount={handleEditorMount}
            options={{
              automaticLayout: true,
              fontSize: editorPreferences.fontSize,
              minimap: { enabled: editorPreferences.minimap },
              wordWrap: editorPreferences.wordWrap ? 'on' : 'off',
              originalEditable: true,
              renderSideBySide: true,
              useInlineViewWhenSpaceIsLimited: false,
              enableSplitViewResizing: true,
              ignoreTrimWhitespace: false,
              diffAlgorithm: 'advanced',
              renderIndicators: true,
              renderMarginRevertIcon: false,
              folding: true,
              scrollBeyondLastLine: false,
              padding: { top: 14, bottom: 14 },
            }}
          />
        </div>

        <div className="utility-actions min-h-10 !items-center">
          <Button className="!h-10 !min-h-10 self-center" disabled={validation.state === 'invalid' || validation.state === 'idle'} onClick={formatAndCompare}><GitCompareArrows size={16} />Format &amp; Compare</Button>
          <Button className="!h-10 !min-h-10 self-center" variant="secondary" disabled={!original && !modified} onClick={swapDocuments}><ArrowLeftRight size={16} />Swap sides</Button>
          <Button className="!h-10 !min-h-10 self-center" variant="secondary" disabled={validation.state === 'invalid' || validation.state === 'idle'} onClick={beginSave}><Save size={16} />Save</Button>
          <Button className="!h-10 !min-h-10 self-center" variant="ghost" onClick={reset}><RotateCcw size={16} />Reset</Button>
        </div>
      </section>

      <Modal isOpen={isSaveDialogOpen} title="Save JSON comparison to your account" onClose={() => setIsSaveDialogOpen(false)}>
        <div className="grid gap-4">
          <p className="muted text-sm">Both JSON documents will be stored together in your private Firebase workspace.</p>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Name</span>
            <Input
              autoFocus
              value={comparisonTitle}
              placeholder="For example: API response changes"
              onChange={(event) => setComparisonTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void saveComparison()
                }
              }}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
            <Button disabled={isSaving} onClick={() => void saveComparison()}>{isSaving ? 'Saving…' : 'Save comparison'}</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
