import { useMemo, useState } from 'react'
import { DEFAULT_CLAMP_SETTINGS } from '../constants'
import { createClampValue } from '../utilities/createClampValue'
import type { ClampSettings } from '../types'

export function useClampGenerator() {
  const [settings, setSettings] = useState<ClampSettings>(DEFAULT_CLAMP_SETTINGS)
  const clampValue = useMemo(() => createClampValue(settings), [settings])

  return {
    settings,
    clampValue,
    setSettings,
    reset: () => setSettings(DEFAULT_CLAMP_SETTINGS),
  }
}
