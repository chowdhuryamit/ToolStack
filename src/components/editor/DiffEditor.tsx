import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react'

export function DiffEditor() {
  return (
    <MonacoDiffEditor
      height="520px"
      language="typescript"
      original="// Original code"
      modified="// Modified code"
      options={{ minimap: { enabled: false }, fontSize: 14 }}
    />
  )
}
