import { DiffEditor, type DiffBeforeMount, type DiffOnMount } from '@monaco-editor/react'
import {
  ArrowLeftRight,
  CheckCircle2,
  Columns2,
  FileCode2,
  FileUp,
  GitCompareArrows,
  Maximize2,
  Minimize2,
  RotateCcw,
  Rows3,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../../../components/ui/Button'
import { Select } from '../../../../components/ui/Select'
import { ThemeToggle } from '../../../../components/ui/ThemeToggle'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'
import { addNotification } from '../../../../store/slices/notificationSlice'
import { cn } from '../../../../utilities/cn'

const ORIGINAL_DRAFT_KEY = 'toolstack.codeDiff.original'
const MODIFIED_DRAFT_KEY = 'toolstack.codeDiff.modified'
const LANGUAGE_KEY = 'toolstack.codeDiff.language'
const EDITOR_SURFACE_THEME_KEY = 'toolstack.codeDiff.editorTheme'

const originalExample = `type User = {
  id: string
  name: string
}

export function findUser(users: User[], id: string) {
  return users.find((user) => user.id === id)
}`

const modifiedExample = `type User = {
  id: string
  name: string
  active: boolean
}

export function findActiveUser(users: User[], id: string) {
  return users.find((user) => user.id === id && user.active)
}`

type LanguageOption = {
  id: string
  label: string
}

const initialLanguages: LanguageOption[] = [
  { id: 'plaintext', label: 'Plain Text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'csharp', label: 'C#' },
  { id: 'cpp', label: 'C++' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'sql', label: 'SQL' },
  { id: 'shell', label: 'Shell' },
]

const languageByExtension: Record<string, string> = {
  c: 'c',
  cc: 'cpp',
  cpp: 'cpp',
  cs: 'csharp',
  css: 'css',
  go: 'go',
  h: 'cpp',
  hpp: 'cpp',
  html: 'html',
  java: 'java',
  js: 'javascript',
  json: 'json',
  jsx: 'javascript',
  md: 'markdown',
  php: 'php',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  sh: 'shell',
  sql: 'sql',
  ts: 'typescript',
  tsx: 'typescript',
  txt: 'plaintext',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
}

export function CodeDiffPage() {
  const [original, setOriginal] = useState(() => sessionStorage.getItem(ORIGINAL_DRAFT_KEY) ?? '')
  const [modified, setModified] = useState(() => sessionStorage.getItem(MODIFIED_DRAFT_KEY) ?? '')
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) ?? 'typescript')
  const [languages, setLanguages] = useState(initialLanguages)
  const [changedRegions, setChangedRegions] = useState<number | null>(null)
  const [isSideBySide, setIsSideBySide] = useState(true)
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [editorSurfaceTheme, setEditorSurfaceTheme] = useState<'dark' | 'light'>(() => (
    localStorage.getItem(EDITOR_SURFACE_THEME_KEY) === 'light' ? 'light' : 'dark'
  ))
  const subscriptions = useRef<Array<{ dispose: () => void }>>([])
  const originalImportRef = useRef<HTMLInputElement>(null)
  const modifiedImportRef = useRef<HTMLInputElement>(null)
  const dispatch = useAppDispatch()
  const editorPreferences = useAppSelector((state) => state.editor)
  const editorTheme = useAppSelector((state) => state.theme.editorTheme)
  const isAppLightTheme = editorTheme === 'vs-light'
  const isEditorSurfaceLight = editorSurfaceTheme === 'light'

  const status = useMemo(() => {
    if (!original && !modified) {
      return { state: 'idle' as const, message: 'Paste or type two files to compare them.' }
    }
    if (original === modified) {
      return { state: 'identical' as const, message: 'Both files are identical.' }
    }
    if (changedRegions === null) {
      return { state: 'changed' as const, message: 'Comparing files…' }
    }
    return {
      state: 'changed' as const,
      message: `${changedRegions} changed ${changedRegions === 1 ? 'region' : 'regions'} found.`,
    }
  }, [changedRegions, modified, original])

  useEffect(() => {
    if (original) sessionStorage.setItem(ORIGINAL_DRAFT_KEY, original)
    else sessionStorage.removeItem(ORIGINAL_DRAFT_KEY)
  }, [original])

  useEffect(() => {
    if (modified) sessionStorage.setItem(MODIFIED_DRAFT_KEY, modified)
    else sessionStorage.removeItem(MODIFIED_DRAFT_KEY)
  }, [modified])

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language)
  }, [language])

  useEffect(() => {
    localStorage.setItem(EDITOR_SURFACE_THEME_KEY, editorSurfaceTheme)
  }, [editorSurfaceTheme])

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

  useEffect(() => () => {
    subscriptions.current.forEach((subscription) => subscription.dispose())
  }, [])

  const handleEditorMount: DiffOnMount = (editor) => {
    subscriptions.current.forEach((subscription) => subscription.dispose())
    const originalModel = editor.getOriginalEditor().getModel()
    const modifiedModel = editor.getModifiedEditor().getModel()

    const updateChangedRegions = () => {
      setChangedRegions(editor.getLineChanges()?.length ?? 0)
    }

    subscriptions.current = [
      originalModel?.onDidChangeContent(() => {
        setChangedRegions(null)
        setOriginal(originalModel.getValue())
      }),
      modifiedModel?.onDidChangeContent(() => {
        setChangedRegions(null)
        setModified(modifiedModel.getValue())
      }),
      editor.onDidUpdateDiff(updateChangedRegions),
    ].filter((subscription): subscription is { dispose: () => void } => Boolean(subscription))

    updateChangedRegions()
  }

  const loadAllMonacoLanguages: DiffBeforeMount = (monaco) => {
    const availableLanguages = monaco.languages.getLanguages() as Array<{
      id: string
      aliases?: string[]
    }>
    const registeredLanguages: LanguageOption[] = availableLanguages
      .map((registeredLanguage) => ({
        id: registeredLanguage.id,
        label: registeredLanguage.aliases?.[0] ?? registeredLanguage.id,
      }))
      .sort((left, right) => left.label.localeCompare(right.label))

    setLanguages(registeredLanguages)
    if (!registeredLanguages.some((option) => option.id === language)) setLanguage('plaintext')
  }

  function loadExample() {
    setLanguage('typescript')
    setChangedRegions(null)
    setOriginal(originalExample)
    setModified(modifiedExample)
  }

  async function importCodeFile(side: 'original' | 'modified', file?: File) {
    if (!file) return
    try {
      const content = await file.text()
      const extension = file.name.split('.').pop()?.toLowerCase()
      const detectedLanguage = extension ? languageByExtension[extension] : undefined
      if (detectedLanguage) setLanguage(detectedLanguage)
      setChangedRegions(null)
      if (side === 'original') setOriginal(content)
      else setModified(content)
      dispatch(addNotification(`Imported ${file.name} as the ${side} file.`, 'success'))
    } catch {
      dispatch(addNotification('Unable to read the selected code file.', 'error'))
    }
  }

  function swapFiles() {
    setChangedRegions(null)
    setOriginal(modified)
    setModified(original)
  }

  function reset() {
    setChangedRegions(null)
    setOriginal('')
    setModified('')
    sessionStorage.removeItem(ORIGINAL_DRAFT_KEY)
    sessionStorage.removeItem(MODIFIED_DRAFT_KEY)
  }

  return (
    <section className={cn(
      'json-workspace -mt-[18px] -mb-5 grid min-h-[calc(100vh-90px)] w-full max-w-none grid-rows-[auto_minmax(0,1fr)] content-start gap-2.5 pb-1 max-[980px]:min-h-[calc(100vh-184px)]',
      isExpanded && 'json-workspace-expanded',
    )}>
      <div className="flex min-w-0 items-center gap-2.5 max-[760px]:flex-wrap">
        <ThemeToggle
          isLight={isEditorSurfaceLight}
          label="Code diff editor theme"
          onChange={(isLight) => setEditorSurfaceTheme(isLight ? 'light' : 'dark')}
        />

        <label className="flex min-w-44 items-center gap-2 text-xs font-semibold">
          <FileCode2 className="shrink-0 text-[var(--page-accent)]" size={16} />
          <span className="sr-only">Language</span>
          <Select
            className="!min-h-8 !py-1"
            aria-label="Code language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            {languages.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </Select>
        </label>

        <div className={cn(
          'flex min-h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-1 text-xs leading-tight transition-colors',
          (status.state === 'changed' || status.state === 'identical') && 'tool-status-accent',
          status.state === 'idle' && (isAppLightTheme ? 'border-slate-300 bg-white text-slate-600' : 'border-slate-700 text-slate-400'),
        )} role="status">
          {status.state === 'identical'
            ? <CheckCircle2 className="shrink-0" size={17} />
            : status.state === 'changed'
              ? <GitCompareArrows className="shrink-0" size={17} />
              : <FileCode2 className="shrink-0" size={17} />}
          <span className="min-w-0 truncate">{status.message}</span>
          <Button
            className="relative z-1 ml-auto !min-h-7 shrink-0 !px-2 !py-1"
            variant="ghost"
            aria-label={isExpanded ? 'Exit expanded view' : 'Expand code diff workspace'}
            aria-pressed={isExpanded}
            title={isExpanded ? 'Exit expanded view (Esc)' : 'Expand code diff workspace'}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>

      <section className="tool-panel grid h-full min-h-0 grid-rows-[auto_minmax(380px,1fr)_auto] !gap-2 !p-3">
        <div className="grid grid-cols-2 gap-6 max-[700px]:gap-3">
          <div className="panel-header !min-h-7">
            <h2>Original code</h2>
            <Button className="mr-15 !min-h-7 !px-2 !py-1" variant="ghost" onClick={() => originalImportRef.current?.click()}><FileUp size={15} />Import</Button>
            <input
              ref={originalImportRef}
              hidden
              type="file"
              onChange={(event) => {
                void importCodeFile('original', event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
          <div className="panel-header !min-h-7">
            <h2>Changed code</h2>
            <div className="flex items-center gap-1">
              <Button className="mr-2 !min-h-7 !px-2 !py-1" variant="ghost" onClick={() => modifiedImportRef.current?.click()}><FileUp size={15} />Import</Button>
              <input
                ref={modifiedImportRef}
                hidden
                type="file"
                onChange={(event) => {
                  void importCodeFile('modified', event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <Button className="!min-h-7 !px-2 !py-1" variant="ghost" onClick={loadExample}>
                <Sparkles size={15} />Example
              </Button>
            </div>
          </div>
        </div>

        <div className={cn(
          'json-editor-shell !h-full min-h-[380px] resize-y overflow-hidden rounded-xl border focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/10',
          isEditorSurfaceLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-[#1e1e1e]',
        )}>
          <DiffEditor
            height="100%"
            language={language}
            original={original}
            modified={modified}
            theme={isEditorSurfaceLight ? 'vs-light' : 'vs-dark'}
            beforeMount={loadAllMonacoLanguages}
            onMount={handleEditorMount}
            options={{
              automaticLayout: true,
              fontSize: editorPreferences.fontSize,
              minimap: { enabled: editorPreferences.minimap },
              wordWrap: editorPreferences.wordWrap ? 'on' : 'off',
              originalEditable: true,
              renderSideBySide: isSideBySide,
              useInlineViewWhenSpaceIsLimited: true,
              enableSplitViewResizing: true,
              ignoreTrimWhitespace: ignoreWhitespace,
              diffAlgorithm: 'advanced',
              renderIndicators: true,
              renderMarginRevertIcon: true,
              folding: true,
              scrollBeyondLastLine: false,
              padding: { top: 14, bottom: 14 },
            }}
          />
        </div>

        <div className="utility-actions min-h-10 !items-center">
          <Button className="!h-10 !min-h-10" variant="secondary" disabled={!original && !modified} onClick={swapFiles}>
            <ArrowLeftRight size={16} />Swap sides
          </Button>
          <Button className="!h-10 !min-h-10" variant="secondary" onClick={() => setIsSideBySide((value) => !value)}>
            {isSideBySide ? <Rows3 size={16} /> : <Columns2 size={16} />}
            {isSideBySide ? 'Inline view' : 'Side-by-side'}
          </Button>
          <Button
            className="!h-10 !min-h-10"
            variant={ignoreWhitespace ? 'primary' : 'secondary'}
            aria-pressed={ignoreWhitespace}
            onClick={() => {
              setChangedRegions(null)
              setIgnoreWhitespace((value) => !value)
            }}
          >
            Ignore whitespace
          </Button>
          <Button className="!h-10 !min-h-10" variant="ghost" onClick={reset}>
            <RotateCcw size={16} />Reset
          </Button>
        </div>
      </section>
    </section>
  )
}
