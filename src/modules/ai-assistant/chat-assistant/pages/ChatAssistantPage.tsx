import { AssistantSettings } from '../components/AssistantSettings'
import { ChatInput } from '../components/ChatInput'
import { ChatMessageList } from '../components/ChatMessageList'
import { PromptLibrary } from '../components/PromptLibrary'
import { CHAT_ASSISTANT_TITLE } from '../constants'
import { useChatAssistant } from '../hooks/useChatAssistant'

export function ChatAssistantPage() {
  const assistant = useChatAssistant()

  return (
    <section className="page-stack ai-chat">
      <div className="section-heading">
        <p className="eyebrow">Assistant</p>
        <h1>{CHAT_ASSISTANT_TITLE}</h1>
      </div>
      <AssistantSettings settings={assistant.settings} />
      <PromptLibrary onPick={assistant.setInput} />
      <ChatMessageList messages={assistant.messages} />
      <ChatInput value={assistant.input} onChange={assistant.setInput} onSend={assistant.send} />
    </section>
  )
}
