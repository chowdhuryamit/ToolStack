import { generateId } from '../../../../utilities/generateId'
import type { ChatMessage } from '../types'

export function createAssistantMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: generateId('message'),
    role,
    content,
    createdAt: new Date().toISOString(),
  }
}
