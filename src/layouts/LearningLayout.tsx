import { EmptyState } from '../components/shared/EmptyState'
import { ToolPage } from '../components/shared/ToolPage'

export function LearningLayout() {
  return (
    <ToolPage title="Learning Hub" description="Collect short lessons, examples, and guided exercises.">
      <EmptyState title="Lessons coming soon" description="Add learning modules under src/modules/learning-hub." />
    </ToolPage>
  )
}
