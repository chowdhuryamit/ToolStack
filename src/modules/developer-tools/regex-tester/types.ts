export const REGEX_FLAGS = [
  { value: 'g', label: 'Global', description: 'Find every match' },
  { value: 'i', label: 'Ignore case', description: 'Match uppercase and lowercase letters' },
  { value: 'm', label: 'Multiline', description: 'Make ^ and $ work on each line' },
  { value: 's', label: 'Dot all', description: 'Allow . to match line breaks' },
  { value: 'u', label: 'Unicode', description: 'Enable Unicode-aware matching' },
  { value: 'y', label: 'Sticky', description: 'Match only from the current position' },
  { value: 'd', label: 'Indices', description: 'Calculate capture-group indices' },
] as const

export type RegexFlag = (typeof REGEX_FLAGS)[number]['value']

export type RegexCapture = {
  number: number
  value?: string
  index?: number
  end?: number
}

export type RegexMatch = {
  value: string
  index: number
  end: number
  captures: RegexCapture[]
  namedGroups: Record<string, string | undefined>
}

export type RegexTestResult = {
  matches: RegexMatch[]
  duration: number
  error?: string
  truncated: boolean
}
