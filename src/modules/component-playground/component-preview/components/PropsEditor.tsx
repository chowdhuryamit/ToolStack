type PropsEditorProps = {
  propsJson: string
  onChange: (value: string) => void
}

export function PropsEditor({ propsJson, onChange }: PropsEditorProps) {
  return <textarea className="input" rows={8} value={propsJson} onChange={(event) => onChange(event.target.value)} />
}
