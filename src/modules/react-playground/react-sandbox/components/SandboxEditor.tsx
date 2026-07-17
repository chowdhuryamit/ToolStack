type SandboxEditorProps = {
  code: string
  onChange: (code: string) => void
}

export function SandboxEditor({ code, onChange }: SandboxEditorProps) {
  return <textarea className="input" rows={12} value={code} onChange={(event) => onChange(event.target.value)} />
}
