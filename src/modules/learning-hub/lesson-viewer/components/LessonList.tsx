import type { Lesson } from '../types'

type LessonListProps = {
  lessons: Lesson[]
  onSelect: (lesson: Lesson) => void
}

export function LessonList({ lessons, onSelect }: LessonListProps) {
  return (
    <ul>
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <button className="button button-ghost" type="button" onClick={() => onSelect(lesson)}>
            {lesson.title}
          </button>
        </li>
      ))}
    </ul>
  )
}
