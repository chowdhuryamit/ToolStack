type ChatInputProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
}

export function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  return (
    <div className="chat-input">
      <input className="input" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Ask the assistant" />
      <button className="button button-primary" type="button" onClick={onSend}>
        Send
      </button>
    </div>
  )
}
