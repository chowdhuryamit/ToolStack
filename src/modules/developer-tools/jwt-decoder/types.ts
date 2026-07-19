export type JsonRecord = Record<string, unknown>

export type JwtStatus = 'active' | 'expired' | 'not-active' | 'future-issued' | 'no-expiration'

export type TokenSizes = {
  header: number
  payload: number
  signature: number
  total: number
}

export type JwtWarning = {
  level: 'danger' | 'warning' | 'info'
  title: string
  message: string
}

export type ParsedJwt = {
  raw: string
  encodedHeader: string
  encodedPayload: string
  encodedSignature: string
  header: JsonRecord
  payload: JsonRecord
  status: JwtStatus
  sizes: TokenSizes
  warnings: JwtWarning[]
}

export type JwtDifference = {
  kind: 'added' | 'removed' | 'changed'
  path: string
  before?: unknown
  after?: unknown
}

export type VerificationCheck = {
  label: string
  state: 'pass' | 'fail' | 'neutral'
  detail: string
}

export type VerificationResult = {
  verified: boolean
  checks: VerificationCheck[]
  keySource: 'secret' | 'public-key' | 'jwks'
}
