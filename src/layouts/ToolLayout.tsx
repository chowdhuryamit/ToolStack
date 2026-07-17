import { useState } from 'react'
import { CodeEditor } from '../components/editor/CodeEditor'
import { EditorToolbar } from '../components/editor/EditorToolbar'
import { OutputPanel } from '../components/editor/OutputPanel'
import { ToolPage } from '../components/shared/ToolPage'

export function ToolLayout() {
  const [language, setLanguage] = useState('typescript')
  const [code, setCode] = useState('')

  return (
    <ToolPage title="Developer Tools" description="Run focused utility workflows from a shared editor surface.">
      <EditorToolbar language={language} onLanguageChange={setLanguage} />
      <div className="split-panel">
        <CodeEditor language={language} value={code} onChange={setCode} />
        <OutputPanel />
      </div>
    </ToolPage>
  )
}
