import Editor from '@monaco-editor/react'
import { useAppSelector } from '../../store/hooks'

type CodeEditorProps = {
  language: string
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  const editorPreferences = useAppSelector((state) => state.editor)
  const editorTheme = useAppSelector((state) => state.theme.editorTheme)

  return (
    <Editor
      height="420px"
      language={language}
      theme={editorTheme}
      value={value}
      onChange={(nextValue) => onChange(nextValue ?? '')}
      options={{
        fontSize: editorPreferences.fontSize,
        minimap: { enabled: editorPreferences.minimap },
        wordWrap: editorPreferences.wordWrap ? 'on' : 'off',
      }}
    />
  )
}
