type LessonProgressProps = {
  completed: number
  total: number
}

export function LessonProgress({ completed, total }: LessonProgressProps) {
  return <p>{completed} of {total} lessons completed</p>
}
