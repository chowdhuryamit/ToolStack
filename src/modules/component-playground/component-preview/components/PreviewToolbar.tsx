type PreviewToolbarProps = {
  onReset: () => void
}

export function PreviewToolbar({ onReset }: PreviewToolbarProps) {
  return (
    <button className="button button-secondary" type="button" onClick={onReset}>
      Reset
    </button>
  )
}
