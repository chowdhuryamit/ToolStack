import { useState } from 'react'
import { DEFAULT_COMPONENT_PREVIEW, PREVIEW_VARIANTS } from '../constants'

export function useComponentPreview() {
  const [state, setState] = useState(DEFAULT_COMPONENT_PREVIEW)
  const [propsJson, setPropsJson] = useState('{}')

  return {
    state,
    propsJson,
    variants: PREVIEW_VARIANTS,
    setPropsJson,
    setVariant: (variant: string) => setState((current) => ({ ...current, variant })),
    reset: () => setState(DEFAULT_COMPONENT_PREVIEW),
  }
}
