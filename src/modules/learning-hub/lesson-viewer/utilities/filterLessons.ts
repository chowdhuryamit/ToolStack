import type { Lesson } from '../types'

export function filterLessons(lessons: Lesson[], query: string) {
  return lessons.filter((lesson) => lesson.title.toLowerCase().includes(query.toLowerCase()))
}
