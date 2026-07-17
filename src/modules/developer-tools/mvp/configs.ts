import type { DeveloperToolConfig } from './DeveloperToolPage'

function required(value: string, name = 'Input') {
  if (!value.trim()) throw new Error(`${name} is required.`)
}

function parseJson(value: string, name = 'JSON') {
  required(value, name)
  try { return JSON.parse(value) as unknown } catch (error) {
    throw new Error(`${name} is invalid: ${error instanceof Error ? error.message : 'syntax error'}`, { cause: error })
  }
}

function base64Encode(value: string) {
  required(value)
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64Decode(value: string) {
  required(value)
  try {
    const binary = atob(value.trim())
    return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))
  } catch { throw new Error('Enter a valid Base64 string.') }
}

function decodeJwt(value: string) {
  required(value, 'JWT')
  const parts = value.trim().split('.')
  if (parts.length !== 3) throw new Error('A JWT must contain header, payload, and signature sections.')
  const decodePart = (part: string) => JSON.parse(base64Decode(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='))) as unknown
  try {
    return JSON.stringify({ header: decodePart(parts[0]), payload: decodePart(parts[1]), signature: parts[2], notice: 'Signature not verified' }, null, 2)
  } catch { throw new Error('The JWT header or payload is not valid Base64URL JSON.') }
}

function jsonDiff(left: unknown, right: unknown, path = '$'): string[] {
  if (Object.is(left, right)) return []
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return [`~ ${path}: ${JSON.stringify(left)} → ${JSON.stringify(right)}`]
  const a = left as Record<string, unknown>; const b = right as Record<string, unknown>
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((key) => {
    const next = `${path}.${key}`
    if (!(key in a)) return [`+ ${next}: ${JSON.stringify(b[key])}`]
    if (!(key in b)) return [`- ${next}: ${JSON.stringify(a[key])}`]
    return jsonDiff(a[key], b[key], next)
  })
}

const jsonExample = '{"name":"ToolStack","active":true,"tools":["JSON","Regex"]}'

export const toolConfigs: Record<string, DeveloperToolConfig> = {
  'json-formatter': { title: 'JSON Formatter, Validator & Minifier', description: 'Format, validate, or minify JSON in one interactive workspace.', example: jsonExample, actions: [{ label: 'Format JSON', process: (value) => JSON.stringify(parseJson(value), null, 2) }], filename: 'formatted.json' },
  'json-validator': { title: 'JSON Validator', description: 'Check JSON syntax and surface clear parsing feedback.', example: jsonExample, outputLabel: 'Validation result', actions: [{ label: 'Validate JSON', process: (value) => { const parsed = parseJson(value); return `Valid JSON\n\nRoot type: ${Array.isArray(parsed) ? 'array' : typeof parsed}\nSize: ${new Blob([value]).size} bytes` } }], filename: 'validation.txt' },
  'json-minifier': { title: 'JSON Minifier', description: 'Remove unnecessary whitespace from JSON for compact transport.', example: '{\n  "environment": "production",\n  "debug": false\n}', actions: [{ label: 'Minify JSON', process: (value) => JSON.stringify(parseJson(value)) }], filename: 'minified.json' },
  'json-diff': { title: 'JSON Diff', description: 'Compare two JSON documents and list additions, removals, and changes.', inputLabel: 'Original JSON', example: '{"name":"ToolStack","version":2,"enabled":true}', secondary: { label: 'Changed JSON', placeholder: 'Paste the changed JSON…', example: '{"name":"ToolStack","version":3,"theme":"dark"}' }, actions: [{ label: 'Compare JSON', process: (a, b) => { const changes = jsonDiff(parseJson(a, 'Original JSON'), parseJson(b, 'Changed JSON')); return changes.length ? changes.join('\n') : 'No differences found.' } }], filename: 'json-diff.txt' },
  'regex-tester': { title: 'Regex Tester', description: 'Test a JavaScript regular expression against text and inspect every match.', inputLabel: 'Regular expression', placeholder: 'Example: \\b[A-Z][a-z]+\\b', example: '\\b[A-Z][a-z]+\\b', secondary: { label: 'Test text', placeholder: 'Enter text to test…', example: 'ToolStack helps Alice and Bob build Faster.' }, actions: [{ label: 'Test Regex', process: (pattern, text) => { required(pattern, 'Regular expression'); required(text, 'Test text'); let regex: RegExp; try { regex = new RegExp(pattern, 'g') } catch (e) { throw new Error(`Invalid expression: ${e instanceof Error ? e.message : 'syntax error'}`, { cause: e }) } const matches = [...text.matchAll(regex)]; return matches.length ? matches.map((match, i) => `${i + 1}. "${match[0]}" at index ${match.index}`).join('\n') : 'No matches found.' } }], filename: 'regex-matches.txt' },
  'jwt-decoder': { title: 'JWT Decoder', description: 'Inspect a JWT header and payload without sending the token anywhere.', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRvb2xTdGFjayIsImlhdCI6MTUxNjIzOTAyMn0.signature', actions: [{ label: 'Decode JWT', process: decodeJwt }], filename: 'decoded-jwt.json' },
  base64: { title: 'Base64 Encoder/Decoder', description: 'Convert Unicode text to Base64 or decode Base64 back to readable text.', example: 'Hello from ToolStack 👋', actions: [{ label: 'Encode', process: base64Encode }, { label: 'Decode', process: base64Decode }], filename: 'base64-output.txt' },
  'url-encoder': { title: 'URL Encoder/Decoder', description: 'Safely encode URL components or restore percent-encoded text.', example: 'https://toolstack.dev/search?q=hello world&mode=fast', actions: [{ label: 'Encode', process: (value) => { required(value); return encodeURIComponent(value) } }, { label: 'Decode', process: (value) => { required(value); try { return decodeURIComponent(value) } catch { throw new Error('Enter a valid percent-encoded value.') } } }], filename: 'url-output.txt' },
  'uuid-generator': { title: 'UUID Generator', description: 'Generate one or more cryptographically random UUID v4 identifiers.', inputLabel: 'Number of UUIDs', placeholder: 'Enter a number from 1 to 100', example: '5', actions: [{ label: 'Generate UUIDs', process: (value) => { const count = Number(value); if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error('Enter a whole number between 1 and 100.'); return Array.from({ length: count }, () => crypto.randomUUID()).join('\n') } }], filename: 'uuids.txt' },
  'hash-generator': { title: 'Hash Generator', description: 'Create a SHA digest from text using the browser Web Crypto API.', example: 'ToolStack keeps processing local.', actions: ['SHA-256', 'SHA-384', 'SHA-512'].map((algorithm) => ({ label: algorithm, process: async (value: string) => { required(value); const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(value)); return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('') } })), filename: 'hash.txt' },
  'timestamp-converter': { title: 'Timestamp Converter', description: 'Convert Unix timestamps or date strings into useful date formats.', inputLabel: 'Timestamp or date', placeholder: 'Unix seconds, milliseconds, or an ISO date', example: '2030-01-01T12:00:00Z', actions: [{ label: 'Convert Timestamp', process: (value) => { required(value); const trimmed = value.trim(); const numeric = Number(trimmed); const date = Number.isFinite(numeric) && trimmed !== '' ? new Date(numeric < 1e12 ? numeric * 1000 : numeric) : new Date(trimmed); if (Number.isNaN(date.getTime())) throw new Error('Enter a valid Unix timestamp or date string.'); return `ISO: ${date.toISOString()}\nUTC: ${date.toUTCString()}\nLocal: ${date.toLocaleString()}\nUnix seconds: ${Math.floor(date.getTime() / 1000)}\nUnix milliseconds: ${date.getTime()}` } }], filename: 'timestamp.txt' },
  'text-case-converter': {
    title: 'Text Case Converter', description: 'Transform text between common casing styles for code and content.', example: 'Build better developer tools', actions: [
      { label: 'UPPERCASE', process: (v) => { required(v); return v.toUpperCase() } },
      { label: 'lowercase', process: (v) => { required(v); return v.toLowerCase() } },
      { label: 'Title Case', process: (v) => { required(v); return v.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) } },
      { label: 'camelCase', process: (v) => { required(v); const words = v.trim().toLowerCase().split(/[^a-z0-9]+/); return words[0] + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('') } },
      { label: 'kebab-case', process: (v) => { required(v); return v.trim().replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() } },
    ], filename: 'converted-text.txt'
  },
}
