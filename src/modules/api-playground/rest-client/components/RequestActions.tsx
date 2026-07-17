type RequestActionsProps = {
  onSend: () => void
}

export function RequestActions({ onSend }: RequestActionsProps) {
  return (
    <button className="button button-primary" type="button" onClick={onSend}>
      Send
    </button>
  )
}
