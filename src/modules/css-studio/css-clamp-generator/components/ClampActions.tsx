type ClampActionsProps = {
  onReset: () => void
}

export function ClampActions({ onReset }: ClampActionsProps) {
  return (
    <button className="button button-secondary" type="button" onClick={onReset}>
      Reset
    </button>
  )
}
