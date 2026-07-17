import { LessonActions } from '../components/LessonActions'
import { LessonContent } from '../components/LessonContent'
import { LessonList } from '../components/LessonList'
import { LessonProgress } from '../components/LessonProgress'
import { LESSON_VIEWER_TITLE } from '../constants'
import { useLessonViewer } from '../hooks/useLessonViewer'

export function LessonViewerPage() {
  const viewer = useLessonViewer()

  return (
    <section className="page-stack">
      <h1>{LESSON_VIEWER_TITLE}</h1>
      <LessonProgress completed={viewer.completedIds.length} total={viewer.lessons.length} />
      <LessonList lessons={viewer.lessons} onSelect={viewer.setSelectedLesson} />
      <LessonContent lesson={viewer.selectedLesson} />
      <LessonActions onComplete={viewer.completeSelectedLesson} />
    </section>
  )
}
