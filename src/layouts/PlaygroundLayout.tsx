import { DiffEditor } from '../components/editor/DiffEditor'
import { ToolPage } from '../components/shared/ToolPage'

export function PlaygroundLayout() {
  return (
    <ToolPage title="Playground" description="Experiment with code, components, and API ideas.">
      <DiffEditor />
    </ToolPage>
  )
}
