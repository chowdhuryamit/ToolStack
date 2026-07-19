import type { RegexMatch, RegexTestResult } from '../types'

const MAX_MATCHES = 5_000

function nextStringIndex(value: string, index: number, unicode: boolean) {
  if (!unicode || index + 1 >= value.length) return index + 1
  const first = value.charCodeAt(index)
  if (first < 0xd800 || first > 0xdbff) return index + 1
  const second = value.charCodeAt(index + 1)
  return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1
}

export function testRegex(pattern: string, flags: string, text: string): RegexTestResult {
  const startedAt = performance.now()

  try {
    const regex = new RegExp(pattern, flags)
    const matches: RegexMatch[] = []
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null && matches.length < MAX_MATCHES) {
      const index = match.index
      const matchIndices = match.indices
      matches.push({
        value: match[0],
        index,
        end: index + match[0].length,
        captures: match.slice(1).map((value, captureIndex) => {
          const range = matchIndices?.[captureIndex + 1]
          return {
            number: captureIndex + 1,
            value,
            index: range?.[0],
            end: range?.[1],
          }
        }),
        namedGroups: { ...(match.groups ?? {}) },
      })

      if (!regex.global) break
      if (match[0] === '') regex.lastIndex = nextStringIndex(text, regex.lastIndex, regex.unicode)
    }

    return {
      matches,
      duration: performance.now() - startedAt,
      truncated: matches.length === MAX_MATCHES,
    }
  } catch (error) {
    return {
      matches: [],
      duration: performance.now() - startedAt,
      error: error instanceof Error ? error.message : 'Invalid regular expression.',
      truncated: false,
    }
  }
}

export function replaceRegex(pattern: string, flags: string, text: string, replacement: string) {
  return text.replace(new RegExp(pattern, flags), replacement)
}
