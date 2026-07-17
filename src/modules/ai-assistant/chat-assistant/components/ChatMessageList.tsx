import type { ChatMessage } from '../types'

type ChatMessageListProps = {
  messages: ChatMessage[]
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <ul className="message-list">
      {messages.length === 0 && <li className="message-bubble assistant">Pick a prompt or ask me to explain, refactor, or test code.</li>}
      {messages.map((message) => (
        <li className={`message-bubble ${message.role}`} key={message.id}>
          {message.content}
        </li>
      ))}
    </ul>
  )
}
