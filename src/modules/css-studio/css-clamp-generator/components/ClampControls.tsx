import type { ClampSettings } from '../types'

type ClampControlsProps = {
  settings: ClampSettings
  onChange: (settings: ClampSettings) => void
}

export function ClampControls({ settings, onChange }: ClampControlsProps) {
  return (
    <div className="tool-grid">
      <label>
        Min size
        <input className="input" type="number" value={settings.minSize} onChange={(event) => onChange({ ...settings, minSize: Number(event.target.value) })} />
      </label>
      <label>
        Max size
        <input className="input" type="number" value={settings.maxSize} onChange={(event) => onChange({ ...settings, maxSize: Number(event.target.value) })} />
      </label>
    </div>
  )
}
