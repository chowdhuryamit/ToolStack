type LessonActionsProps = {
  onComplete: () => void
}

export function LessonActions({ onComplete }: LessonActionsProps) {
  return (
    <button className="button button-primary" type="button" onClick={onComplete}>
      Mark complete
    </button>
  )
}
