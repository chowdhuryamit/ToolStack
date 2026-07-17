import { useState } from 'react'
import { DEFAULT_REACT_SNIPPET } from '../constants'
import { createPreviewLabel } from '../utilities/createPreviewLabel'

export function useReactSandbox() {
  const [code, setCode] = useState(DEFAULT_REACT_SNIPPET)
  const [logs, setLogs] = useState<string[]>([])
  const [preview, setPreview] = useState(createPreviewLabel(DEFAULT_REACT_SNIPPET))

  function run() {
    setPreview(createPreviewLabel(code))
    setLogs((items) => [`Rendered ${code.length} characters`, ...items])
  }

  return { code, logs, preview, setCode, run }
}
