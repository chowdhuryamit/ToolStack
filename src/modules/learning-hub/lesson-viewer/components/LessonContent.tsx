import type { Lesson } from '../types'

type LessonContentProps = {
  lesson: Lesson
}

export function LessonContent({ lesson }: LessonContentProps) {
  return <p>{lesson.summary}</p>
}
