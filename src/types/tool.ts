export type ToolCategory =
  | 'developer-tools'
  | 'css-studio'
  | 'api-playground'
  | 'git-visualizer'
  | 'react-playground'
  | 'component-playground'
  | 'learning-hub'
  | 'ai-assistant'

export type Snippet = {
  id: string
  title: string
  language: string
  code: string
  updatedAt: string
}
