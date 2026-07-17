import { useState } from 'react'
import { DEFAULT_LESSONS } from '../constants'
import type { Lesson } from '../types'

export function useLessonViewer() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(DEFAULT_LESSONS[0])
  const [completedIds, setCompletedIds] = useState<string[]>([])

  function completeSelectedLesson() {
    setCompletedIds((ids) => Array.from(new Set([...ids, selectedLesson.id])))
  }

  return { lessons: DEFAULT_LESSONS, selectedLesson, completedIds, setSelectedLesson, completeSelectedLesson }
}
