import type { AssistantSettings as AssistantSettingsType } from '../types'

type AssistantSettingsProps = {
  settings: AssistantSettingsType
}

export function AssistantSettings({ settings }: AssistantSettingsProps) {
  return <p>Model: {settings.model}</p>
}
