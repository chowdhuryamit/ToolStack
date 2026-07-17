type JsonActionsProps = {
  onFormat: () => void
  onMinify: () => void
  onClear: () => void
}

export function JsonActions({ onFormat, onMinify, onClear }: JsonActionsProps) {
  return (
    <div className="toolbar">
      <button className="button button-primary" type="button" onClick={onFormat}>
        Format
      </button>
      <button className="button button-secondary" type="button" onClick={onMinify}>
        Minify
      </button>
      <button className="button button-ghost" type="button" onClick={onClear}>
        Clear
      </button>
    </div>
  )
}
