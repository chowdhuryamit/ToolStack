import type { ComponentPreviewState } from '../types'

type PreviewCanvasProps = {
  state: ComponentPreviewState
}

export function PreviewCanvas({ state }: PreviewCanvasProps) {
  return <section className="empty-state">{state.name}</section>
}
