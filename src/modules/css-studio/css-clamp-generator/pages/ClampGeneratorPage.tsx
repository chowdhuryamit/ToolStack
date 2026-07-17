import { useState } from 'react'
import { ClampActions } from '../components/ClampActions'
import { ClampControls } from '../components/ClampControls'
import { ClampOutput } from '../components/ClampOutput'
import { ClampPreview } from '../components/ClampPreview'
import { CSS_CLAMP_GENERATOR_TITLE } from '../constants'
import { useClampGenerator } from '../hooks/useClampGenerator'

export function ClampGeneratorPage() {
  const generator = useClampGenerator()
  const [showCode, setShowCode] = useState(true)

  return (
    <section className="page-stack tool-workspace">
      <div className="section-heading">
        <p className="eyebrow">CSS studio</p>
        <h1>{CSS_CLAMP_GENERATOR_TITLE}</h1>
        <p className="muted">Tune responsive values with instant preview and exact CSS output.</p>
      </div>
      <div className="css-studio-grid">
        <section className="tool-panel">
          <div className="panel-header">
            <h2>Controls</h2>
            <ClampActions onReset={generator.reset} />
          </div>
          <ClampControls settings={generator.settings} onChange={generator.setSettings} />
          <button className="button button-secondary" type="button" onClick={() => setShowCode((value) => !value)}>
            {showCode ? 'Hide code' : 'View code'}
          </button>
        </section>
        <section className="tool-panel preview-stage">
          <ClampPreview clampValue={generator.clampValue} />
          {showCode && (
            <div className="code-overlay">
              <ClampOutput value={generator.clampValue} />
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
