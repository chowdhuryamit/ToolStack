export type LocalSnippet = {
  id: string
  type: 'json' | 'regex' | 'css' | 'react'
  title: string
  content: string
  createdAt: number
  updatedAt: number
  synced: boolean
}

export type ToolHistory = {
  id: string
  toolId: string
  input?: string
  output?: string
  createdAt: number
}

export type LocalProject = {
  id: string
  type: 'react' | 'component' | 'api'
  title: string
  files: Record<string, string>
  createdAt: number
  updatedAt: number
}
