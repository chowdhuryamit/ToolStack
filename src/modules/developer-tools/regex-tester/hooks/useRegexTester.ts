import { useMemo, useState } from 'react'
import { useDebounce } from '../../../../hooks/useDebounce'
import type { RegexFlag } from '../types'
import { replaceRegex, testRegex } from '../utilities/testRegex'

const EXAMPLE_PATTERN = '\\b(?<name>[A-Z][a-z]+)\\b'
const EXAMPLE_TEXT = 'ToolStack helps Alice and Bob build Faster.\nToolStack stays local.'
const EXAMPLE_REPLACEMENT = '[$<name>]'

export type RegexTesterPreset = {
  pattern: string
  text: string
  flags: RegexFlag[]
  replacement?: string
  replacementEnabled?: boolean
}

export function useRegexTester() {
  const [pattern, setPattern] = useState('')
  const [text, setText] = useState('')
  const [replacement, setReplacementValue] = useState('')
  const [replacementEnabled, setReplacementEnabled] = useState(false)
  const [flags, setFlags] = useState<RegexFlag[]>(['g'])
  const debouncedPattern = useDebounce(pattern, 150)
  const debouncedText = useDebounce(text, 150)
  const debouncedReplacement = useDebounce(replacement, 150)
  const flagString = flags.join('')

  const result = useMemo(() => {
    if (!debouncedPattern) return undefined
    return testRegex(debouncedPattern, flagString, debouncedText)
  }, [debouncedPattern, debouncedText, flagString])

  const replacementOutput = useMemo(() => {
    if (!replacementEnabled || !debouncedPattern || result?.error) return undefined
    return replaceRegex(debouncedPattern, flagString, debouncedText, debouncedReplacement)
  }, [debouncedPattern, debouncedReplacement, debouncedText, flagString, replacementEnabled, result?.error])

  function toggleFlag(flag: RegexFlag) {
    setFlags((current) => current.includes(flag)
      ? current.filter((value) => value !== flag)
      : [...current, flag])
  }

  function loadExample() {
    setPattern(EXAMPLE_PATTERN)
    setText(EXAMPLE_TEXT)
    setReplacementValue(EXAMPLE_REPLACEMENT)
    setReplacementEnabled(true)
    setFlags(['g'])
  }

  function loadPreset(preset: RegexTesterPreset) {
    setPattern(preset.pattern)
    setText(preset.text)
    setReplacementValue(preset.replacement ?? '')
    setReplacementEnabled(preset.replacementEnabled ?? preset.replacement !== undefined)
    setFlags(preset.flags)
  }

  function reset() {
    setPattern('')
    setText('')
    setReplacementValue('')
    setReplacementEnabled(false)
    setFlags(['g'])
  }

  function setReplacement(value: string) {
    setReplacementValue(value)
    setReplacementEnabled(true)
  }

  return {
    pattern,
    text,
    replacement,
    replacementEnabled,
    replacementOutput,
    flags,
    flagString,
    result,
    setPattern,
    setText,
    setReplacement,
    setReplacementEnabled,
    toggleFlag,
    loadExample,
    loadPreset,
    reset,
  }
}
