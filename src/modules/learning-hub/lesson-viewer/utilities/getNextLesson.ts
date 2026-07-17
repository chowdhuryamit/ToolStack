import type { Lesson } from '../types'

export function getNextLesson(lessons: Lesson[], currentLessonId: string) {
  const index = lessons.findIndex((lesson) => lesson.id === currentLessonId)
  return lessons[index + 1] ?? lessons[0]
}
