import type { ComponentPreviewState } from './types'

export const COMPONENT_PREVIEW_TITLE = 'Component Preview'
export const COMPONENT_PREVIEW_ROUTE = '/tools/component-preview'
export const PREVIEW_VARIANTS = ['Default', 'Compact', 'Disabled']

export const DEFAULT_COMPONENT_PREVIEW: ComponentPreviewState = {
  name: 'Button',
  variant: 'Default',
}
