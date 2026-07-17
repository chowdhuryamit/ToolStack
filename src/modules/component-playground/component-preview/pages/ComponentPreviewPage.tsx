import { PreviewCanvas } from '../components/PreviewCanvas'
import { PreviewToolbar } from '../components/PreviewToolbar'
import { PropsEditor } from '../components/PropsEditor'
import { VariantSelector } from '../components/VariantSelector'
import { COMPONENT_PREVIEW_TITLE } from '../constants'
import { useComponentPreview } from '../hooks/useComponentPreview'

export function ComponentPreviewPage() {
  const preview = useComponentPreview()

  return (
    <section className="page-stack">
      <h1>{COMPONENT_PREVIEW_TITLE}</h1>
      <VariantSelector variants={preview.variants} value={preview.state.variant} onChange={preview.setVariant} />
      <PropsEditor propsJson={preview.propsJson} onChange={preview.setPropsJson} />
      <PreviewToolbar onReset={preview.reset} />
      <PreviewCanvas state={preview.state} />
    </section>
  )
}
