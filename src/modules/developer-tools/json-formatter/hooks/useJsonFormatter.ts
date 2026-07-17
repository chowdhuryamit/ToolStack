import { useState } from 'react'
import { formatJson } from '../utilities/formatJson'
import { minifyJson } from '../utilities/minifyJson'
import { validateJson } from '../utilities/validateJson'

export function useJsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string>()

  function format() {
    const validation = validateJson(input)
    setError(validation.error)
    if (validation.isValid) setOutput(formatJson(input))
  }

  function minify() {
    const validation = validateJson(input)
    setError(validation.error)
    if (validation.isValid) setOutput(minifyJson(input))
  }

  function clear() {
    setInput('')
    setOutput('')
    setError(undefined)
  }

  return { input, output, error, setInput, format, minify, clear }
}
