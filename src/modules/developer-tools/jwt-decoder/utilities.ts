import type {
  JsonRecord,
  JwtDifference,
  JwtStatus,
  JwtWarning,
  ParsedJwt,
  VerificationCheck,
  VerificationResult,
} from './types'

const textEncoder = new TextEncoder()

const claimDescriptions: Record<string, string> = {
  iss: 'Issuer — the service that created the token',
  sub: 'Subject — the user or entity represented by the token',
  aud: 'Audience — the application or API intended to accept the token',
  exp: 'Expiration time — the token must not be accepted after this time',
  nbf: 'Not before — the token must not be accepted before this time',
  iat: 'Issued at — when the token was created',
  jti: 'JWT ID — a unique identifier for this token',
  scope: 'Scope — permissions granted to this token',
}

const sensitiveClaimPattern = /(password|passwd|secret|api.?key|private.?key|credit.?card|access.?key)/i

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeJwtInput(value: string) {
  return value
    .trim()
    .replace(/^authorization\s*:\s*bearer\s+/i, '')
    .replace(/^bearer\s+/i, '')
    .trim()
}

export function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new Error('A token section contains invalid Base64URL characters.')
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  try {
    const binary = atob(padded)
    return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))
  } catch {
    throw new Error('A token section is not valid Base64URL data.')
  }
}

export function encodeBase64Url(value: string | Uint8Array) {
  const bytes = typeof value === 'string' ? textEncoder.encode(value) : value
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeJsonSection(section: string, name: string): JsonRecord {
  let parsed: unknown
  try {
    parsed = JSON.parse(decodeBase64Url(section)) as unknown
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`The JWT ${name} is not valid JSON.`, { cause: error })
    throw error
  }
  if (!isRecord(parsed)) throw new Error(`The JWT ${name} must contain a JSON object.`)
  return parsed
}

function numericClaim(payload: JsonRecord, claim: string) {
  const value = payload[claim]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function getJwtStatus(payload: JsonRecord, nowSeconds = Date.now() / 1000): JwtStatus {
  const notBefore = numericClaim(payload, 'nbf')
  const issuedAt = numericClaim(payload, 'iat')
  const expiresAt = numericClaim(payload, 'exp')
  if (notBefore !== undefined && nowSeconds < notBefore) return 'not-active'
  if (issuedAt !== undefined && issuedAt > nowSeconds + 300) return 'future-issued'
  if (expiresAt !== undefined && nowSeconds >= expiresAt) return 'expired'
  return expiresAt === undefined ? 'no-expiration' : 'active'
}

function findSensitivePaths(value: unknown, path = 'payload'): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => findSensitivePaths(item, `${path}[${index}]`))
  if (!isRecord(value)) return []
  return Object.entries(value).flatMap(([key, child]) => [
    ...(sensitiveClaimPattern.test(key) ? [`${path}.${key}`] : []),
    ...findSensitivePaths(child, `${path}.${key}`),
  ])
}

export function analyzeWarnings(header: JsonRecord, payload: JsonRecord, signature = '', tokenSize = 0): JwtWarning[] {
  const warnings: JwtWarning[] = []
  const algorithm = typeof header.alg === 'string' ? header.alg : ''
  const expiresAt = numericClaim(payload, 'exp')
  const issuedAt = numericClaim(payload, 'iat')
  const now = Date.now() / 1000

  if (!algorithm) warnings.push({ level: 'danger', title: 'Missing signing algorithm', message: 'The header does not declare an alg value.' })
  if (algorithm.toLowerCase() === 'none') warnings.push({ level: 'danger', title: 'Unsigned token', message: 'alg is set to none, so this token has no cryptographic signature.' })
  if (!signature && algorithm.toLowerCase() !== 'none') warnings.push({ level: 'danger', title: 'Missing signature', message: 'The signature section is empty even though the token declares a signing algorithm.' })
  if (expiresAt === undefined) warnings.push({ level: 'warning', title: 'No expiration', message: 'The payload has no exp claim. Confirm that the issuer intentionally creates non-expiring tokens.' })
  if (expiresAt !== undefined && now >= expiresAt) warnings.push({ level: 'danger', title: 'Token expired', message: `This token expired ${formatRelativeDuration(now - expiresAt)} ago.` })
  if (issuedAt !== undefined && issuedAt > now + 300) warnings.push({ level: 'warning', title: 'Issued in the future', message: 'The iat claim is more than five minutes ahead of this device clock.' })
  if (issuedAt !== undefined && expiresAt !== undefined && expiresAt - issuedAt > 86_400 * 30) warnings.push({ level: 'warning', title: 'Long token lifetime', message: `The declared lifetime is ${formatDuration(expiresAt - issuedAt)}.` })
  if (payload.iss === undefined) warnings.push({ level: 'info', title: 'No issuer claim', message: 'There is no iss value to identify who created the token.' })
  if (payload.aud === undefined) warnings.push({ level: 'info', title: 'No audience claim', message: 'There is no aud value describing which application should accept the token.' })
  if (tokenSize > 4_096) warnings.push({ level: 'warning', title: 'Large token', message: `This token is ${tokenSize.toLocaleString()} bytes. Large JWTs can exceed cookie or HTTP header limits.` })
  const sensitivePaths = findSensitivePaths(payload)
  if (sensitivePaths.length) warnings.push({ level: 'danger', title: 'Sensitive-looking claims', message: `Review ${sensitivePaths.slice(0, 3).join(', ')}. JWT payloads are encoded, not encrypted.` })
  return warnings
}

export function parseJwt(value: string): ParsedJwt {
  const raw = normalizeJwtInput(value)
  if (!raw) throw new Error('Paste a JWT to inspect it.')
  const parts = raw.split('.')
  if (parts.length !== 3) throw new Error('A JWT must contain header, payload, and signature sections separated by two dots.')
  if (!parts[0] || !parts[1]) throw new Error('The JWT header and payload sections cannot be empty.')
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const header = decodeJsonSection(encodedHeader, 'header')
  const payload = decodeJsonSection(encodedPayload, 'payload')
  const totalSize = textEncoder.encode(raw).length
  return {
    raw,
    encodedHeader,
    encodedPayload,
    encodedSignature,
    header,
    payload,
    status: getJwtStatus(payload),
    sizes: {
      header: textEncoder.encode(encodedHeader).length,
      payload: textEncoder.encode(encodedPayload).length,
      signature: textEncoder.encode(encodedSignature).length,
      total: totalSize,
    },
    warnings: analyzeWarnings(header, payload, encodedSignature, totalSize),
  }
}

export function getClaimDescription(claim: string) {
  return claimDescriptions[claim] ?? 'Custom claim defined by the token issuer'
}

export function isTimeClaim(claim: string, value: unknown): value is number {
  return ['exp', 'iat', 'nbf'].includes(claim) && typeof value === 'number' && Number.isFinite(value)
}

export function formatTimestamp(seconds: number) {
  const date = new Date(seconds * 1000)
  return Number.isNaN(date.getTime()) ? 'Invalid timestamp' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'long' })
}

export function formatDuration(seconds: number) {
  const absolute = Math.max(0, Math.round(Math.abs(seconds)))
  const units = [
    { label: 'day', size: 86_400 },
    { label: 'hour', size: 3_600 },
    { label: 'minute', size: 60 },
    { label: 'second', size: 1 },
  ]
  const unit = units.find(({ size }) => absolute >= size) ?? units.at(-1)!
  const amount = Math.round(absolute / unit.size)
  return `${amount} ${unit.label}${amount === 1 ? '' : 's'}`
}

export function formatRelativeDuration(seconds: number) {
  return formatDuration(seconds)
}

export function tokenLifetime(payload: JsonRecord) {
  const issuedAt = numericClaim(payload, 'iat')
  const expiresAt = numericClaim(payload, 'exp')
  return issuedAt !== undefined && expiresAt !== undefined ? expiresAt - issuedAt : undefined
}

function valuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function compareJwtPayloads(left: JsonRecord, right: JsonRecord, path = 'payload'): JwtDifference[] {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  return [...keys].flatMap((key): JwtDifference[] => {
    const nextPath = `${path}.${key}`
    if (!(key in left)) return [{ kind: 'added', path: nextPath, after: right[key] }]
    if (!(key in right)) return [{ kind: 'removed', path: nextPath, before: left[key] }]
    const before = left[key]
    const after = right[key]
    if (isRecord(before) && isRecord(after)) return compareJwtPayloads(before, after, nextPath)
    return valuesEqual(before, after) ? [] : [{ kind: 'changed', path: nextPath, before, after }]
  })
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function pemToBytes(value: string) {
  const body = value.replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s/g, '')
  if (!body) throw new Error('Paste a valid PEM public key.')
  try {
    return Uint8Array.from(atob(body), (character) => character.charCodeAt(0))
  } catch {
    throw new Error('The public key is not valid PEM data.')
  }
}

type AlgorithmDetails = {
  family: 'hmac' | 'rsa' | 'pss' | 'ecdsa'
  hash: 'SHA-256' | 'SHA-384' | 'SHA-512'
  curve?: 'P-256' | 'P-384' | 'P-521'
}

function algorithmDetails(algorithm: unknown): AlgorithmDetails {
  const details: Record<string, AlgorithmDetails> = {
    HS256: { family: 'hmac', hash: 'SHA-256' }, HS384: { family: 'hmac', hash: 'SHA-384' }, HS512: { family: 'hmac', hash: 'SHA-512' },
    RS256: { family: 'rsa', hash: 'SHA-256' }, RS384: { family: 'rsa', hash: 'SHA-384' }, RS512: { family: 'rsa', hash: 'SHA-512' },
    PS256: { family: 'pss', hash: 'SHA-256' }, PS384: { family: 'pss', hash: 'SHA-384' }, PS512: { family: 'pss', hash: 'SHA-512' },
    ES256: { family: 'ecdsa', hash: 'SHA-256', curve: 'P-256' }, ES384: { family: 'ecdsa', hash: 'SHA-384', curve: 'P-384' }, ES512: { family: 'ecdsa', hash: 'SHA-512', curve: 'P-521' },
  }
  if (typeof algorithm !== 'string' || !details[algorithm]) throw new Error(`Signature verification for ${String(algorithm || 'this algorithm')} is not supported.`)
  return details[algorithm]
}

async function importVerificationKey(details: AlgorithmDetails, keyValue: string | JsonWebKey) {
  if (details.family === 'hmac') {
    if (typeof keyValue !== 'string' || !keyValue) throw new Error('Enter the shared HMAC secret.')
    return crypto.subtle.importKey('raw', textEncoder.encode(keyValue), { name: 'HMAC', hash: details.hash }, false, ['verify'])
  }

  const importAlgorithm = details.family === 'rsa'
    ? { name: 'RSASSA-PKCS1-v1_5', hash: details.hash }
    : details.family === 'pss'
      ? { name: 'RSA-PSS', hash: details.hash }
      : { name: 'ECDSA', namedCurve: details.curve! }
  return typeof keyValue === 'string'
    ? crypto.subtle.importKey('spki', pemToBytes(keyValue), importAlgorithm, false, ['verify'])
    : crypto.subtle.importKey('jwk', keyValue, importAlgorithm, false, ['verify'])
}

function audienceMatches(actual: unknown, expected: string) {
  if (!expected) return true
  return typeof actual === 'string' ? actual === expected : Array.isArray(actual) && actual.includes(expected)
}

export async function verifyJwt(
  token: ParsedJwt,
  keyValue: string | JsonWebKey,
  expectedIssuer = '',
  expectedAudience = '',
  keySource: VerificationResult['keySource'] = 'public-key',
): Promise<VerificationResult> {
  const details = algorithmDetails(token.header.alg)
  const key = await importVerificationKey(details, keyValue)
  const data = textEncoder.encode(`${token.encodedHeader}.${token.encodedPayload}`)
  const signature = base64UrlToBytes(token.encodedSignature)
  const verifyAlgorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams = details.family === 'hmac'
    ? { name: 'HMAC' }
    : details.family === 'rsa'
      ? { name: 'RSASSA-PKCS1-v1_5' }
      : details.family === 'pss'
        ? { name: 'RSA-PSS', saltLength: details.hash === 'SHA-256' ? 32 : details.hash === 'SHA-384' ? 48 : 64 }
        : { name: 'ECDSA', hash: details.hash }
  const signatureValid = await crypto.subtle.verify(verifyAlgorithm, key, signature, data)
  const now = Date.now() / 1000
  const expiration = numericClaim(token.payload, 'exp')
  const notBefore = numericClaim(token.payload, 'nbf')
  const issuerPass = !expectedIssuer || token.payload.iss === expectedIssuer
  const audiencePass = audienceMatches(token.payload.aud, expectedAudience)
  const timePass = (expiration === undefined || now < expiration) && (notBefore === undefined || now >= notBefore)
  const checks: VerificationCheck[] = [
    { label: 'Signature', state: signatureValid ? 'pass' : 'fail', detail: signatureValid ? 'The cryptographic signature matches.' : 'The signature does not match this key.' },
    { label: 'Time validity', state: timePass ? 'pass' : 'fail', detail: timePass ? 'The token is within its declared time window.' : 'The token is expired or not active yet.' },
    { label: 'Issuer', state: expectedIssuer ? (issuerPass ? 'pass' : 'fail') : 'neutral', detail: expectedIssuer ? (issuerPass ? 'The issuer matches.' : `Expected ${expectedIssuer}, received ${String(token.payload.iss ?? 'no issuer')}.`) : 'No expected issuer supplied.' },
    { label: 'Audience', state: expectedAudience ? (audiencePass ? 'pass' : 'fail') : 'neutral', detail: expectedAudience ? (audiencePass ? 'The audience matches.' : `Expected ${expectedAudience}.`) : 'No expected audience supplied.' },
  ]
  return { verified: signatureValid && timePass && issuerPass && audiencePass, checks, keySource }
}

export async function fetchJwksKey(url: string, token: ParsedJwt) {
  if (!url.trim()) throw new Error('Enter an issuer or JWKS URL.')
  const requestedUrl = url.trim().replace(/\/$/, '')
  let parsedUrl: URL
  try {
    parsedUrl = new URL(requestedUrl)
  } catch (error) {
    throw new Error('Enter a valid absolute issuer or JWKS URL.', { cause: error })
  }
  const looksLikeKeyEndpoint = /jwks|well-known|\.json(?:$|\/)/i.test(parsedUrl.pathname)
  let response = await fetch(looksLikeKeyEndpoint ? requestedUrl : `${requestedUrl}/.well-known/openid-configuration`)
  if (!response.ok) throw new Error(`JWKS request failed with HTTP ${response.status}.`)
  let document = await response.json() as { keys?: Array<JsonWebKey & { kid?: string }>; jwks_uri?: string }
  if (!Array.isArray(document.keys)) {
    const discoveryUrl = typeof document.jwks_uri === 'string' || !looksLikeKeyEndpoint
      ? undefined
      : `${requestedUrl}/.well-known/openid-configuration`
    if (discoveryUrl) {
      response = await fetch(discoveryUrl)
      if (!response.ok) throw new Error(`Issuer discovery failed with HTTP ${response.status}.`)
      document = await response.json() as typeof document
    }
    if (typeof document.jwks_uri !== 'string') throw new Error('The issuer metadata does not provide a jwks_uri.')
    response = await fetch(document.jwks_uri)
    if (!response.ok) throw new Error(`JWKS request failed with HTTP ${response.status}.`)
    document = await response.json() as typeof document
  }
  if (!Array.isArray(document.keys) || document.keys.length === 0) throw new Error('The JWKS response does not contain any keys.')
  const keyId = typeof token.header.kid === 'string' ? token.header.kid : undefined
  if (!keyId && document.keys.length > 1) throw new Error('The token has no kid header and the JWKS contains multiple keys.')
  const key = keyId ? document.keys.find((candidate) => candidate.kid === keyId) : document.keys[0]
  if (!key) throw new Error(`No JWKS key matches kid ${keyId}.`)
  return key
}

export async function signHsJwt(headerText: string, payloadText: string, secret: string) {
  if (!secret) throw new Error('Enter a signing secret for this test token.')
  const header = JSON.parse(headerText) as unknown
  const payload = JSON.parse(payloadText) as unknown
  if (!isRecord(header) || !isRecord(payload)) throw new Error('Header and payload must both be JSON objects.')
  const details = algorithmDetails(header.alg)
  if (details.family !== 'hmac') throw new Error('The token builder supports HS256, HS384, and HS512 test tokens.')
  const encodedHeader = encodeBase64Url(JSON.stringify(header))
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: details.hash }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(data))
  return `${data}.${encodeBase64Url(new Uint8Array(signature))}`
}
