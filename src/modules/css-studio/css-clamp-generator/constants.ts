import type { ClampSettings } from './types'

export const CSS_CLAMP_GENERATOR_TITLE = 'CSS Clamp Generator'
export const CSS_CLAMP_GENERATOR_ROUTE = '/tools/css-clamp-generator'

export const DEFAULT_CLAMP_SETTINGS: ClampSettings = {
  minSize: 16,
  maxSize: 40,
  minViewport: 320,
  maxViewport: 1200,
}
