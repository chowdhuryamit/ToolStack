import type { Lesson } from './types'

export const LESSON_VIEWER_TITLE = 'Lesson Viewer'
export const LESSON_VIEWER_ROUTE = '/learn/lessons'

export const DEFAULT_LESSONS: Lesson[] = [
  { id: 'intro', title: 'ToolStack basics', summary: 'Learn how tools, modules, and shared components fit together.' },
]
