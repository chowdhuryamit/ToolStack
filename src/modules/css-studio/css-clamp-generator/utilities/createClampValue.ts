import type { ClampSettings } from '../types'

export function createClampValue(settings: ClampSettings) {
  const slope = ((settings.maxSize - settings.minSize) / (settings.maxViewport - settings.minViewport)) * 100
  const intercept = settings.minSize - (slope * settings.minViewport) / 100
  return `clamp(${settings.minSize}px, ${intercept.toFixed(2)}px + ${slope.toFixed(2)}vw, ${settings.maxSize}px)`
}
