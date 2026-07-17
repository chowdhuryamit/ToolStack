type SandboxToolbarProps = {
  onRun: () => void
}

export function SandboxToolbar({ onRun }: SandboxToolbarProps) {
  return (
    <button className="button button-primary" type="button" onClick={onRun}>
      Run
    </button>
  )
}
