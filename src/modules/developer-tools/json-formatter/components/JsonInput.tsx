type JsonInputProps = {
  value: string
  onChange: (value: string) => void
}

export function JsonInput({ value, onChange }: JsonInputProps) {
  return (
    <textarea
      autoFocus
      aria-label="JSON input"
      className="input"
      rows={12}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder='{"message":"Paste JSON here"}'
    />
  )
}
