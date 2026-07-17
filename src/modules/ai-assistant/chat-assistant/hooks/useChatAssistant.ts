import { useState } from 'react'
import { DEFAULT_ASSISTANT_SETTINGS } from '../constants'
import { createAssistantMessage } from '../utilities/createAssistantMessage'
import type { ChatMessage } from '../types'

export function useChatAssistant() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  function send() {
    if (!input.trim()) return
    setMessages((items) => [...items, createAssistantMessage('user', input), createAssistantMessage('assistant', 'Draft response placeholder.')])
    setInput('')
  }

  return { input, messages, settings: DEFAULT_ASSISTANT_SETTINGS, setInput, send }
}
