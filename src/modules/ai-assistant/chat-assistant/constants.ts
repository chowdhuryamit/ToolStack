import type { AssistantSettings } from './types'

export const CHAT_ASSISTANT_TITLE = 'AI Assistant'
export const CHAT_ASSISTANT_ROUTE = '/assistant'
export const DEFAULT_PROMPTS = ['Explain this code', 'Find bugs', 'Create tests']

export const DEFAULT_ASSISTANT_SETTINGS: AssistantSettings = {
  model: 'local-placeholder',
  temperature: 0.2,
}
