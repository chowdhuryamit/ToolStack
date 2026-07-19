import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Braces,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileKey2,
  GitCompareArrows,
  Info,
  KeyRound,
  LockKeyhole,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { clipboardService } from '../../../../services/clipboardService'
import { downloadTextFile } from '../../../../services/downloadService'
import { useAppDispatch } from '../../../../store/hooks'
import { addNotification } from '../../../../store/slices/notificationSlice'
import type { JwtStatus, ParsedJwt, VerificationResult } from '../types'
import {
  compareJwtPayloads,
  fetchJwksKey,
  formatDuration,
  formatTimestamp,
  getClaimDescription,
  isTimeClaim,
  parseJwt,
  signHsJwt,
  tokenLifetime,
  verifyJwt,
} from '../utilities'

type Tab = 'inspect' | 'compare' | 'create' | 'guide'

const demoSecret = 'toolstack-demo-secret-keep-private'

const defaultBuilderHeader = `{
  "alg": "HS256",
  "typ": "JWT"
}`

function defaultBuilderPayload() {
  const now = Math.floor(Date.now() / 1000)
  return JSON.stringify({
    sub: 'user-123',
    name: 'ToolStack Developer',
    role: 'admin',
    scope: 'users:read users:write',
    iat: now,
    exp: now + 3600,
  }, null, 2)
}

function tryParseJwt(value: string) {
  if (!value.trim()) return { token: undefined, error: '' }
  try {
    return { token: parseJwt(value), error: '' }
  } catch (error) {
    return { token: undefined, error: error instanceof Error ? error.message : 'Unable to decode this token.' }
  }
}

function statusCopy(status: JwtStatus) {
  const labels: Record<JwtStatus, { label: string; detail: string }> = {
    active: { label: 'Active', detail: 'Within its declared time window' },
    expired: { label: 'Expired', detail: 'The expiration time has passed' },
    'not-active': { label: 'Not active yet', detail: 'The nbf time is still in the future' },
    'future-issued': { label: 'Future issued', detail: 'The iat time is ahead of this clock' },
    'no-expiration': { label: 'No expiration', detail: 'No exp claim is present' },
  }
  return labels[status]
}

function displayValue(value: unknown) {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

function permissionItems(claim: string, value: unknown) {
  if (!['scope', 'permissions', 'roles', 'role'].includes(claim)) return []
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value !== 'string') return []
  return claim === 'scope' ? value.split(/\s+/).filter(Boolean) : [value]
}

function audienceText(value: unknown) {
  return Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : 'Not provided'
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`tool-panel jwt-panel ${className}`}>{children}</section>
}

function CopyIconButton({ value, label, onCopy }: { value: string; label: string; onCopy: (value: string, label: string) => void }) {
  return (
    <Button className="jwt-icon-button" variant="ghost" aria-label={`Copy ${label}`} onClick={() => onCopy(value, label)}>
      <Copy size={15} />
    </Button>
  )
}

function JsonSection({ title, value, encoded, onCopy }: { title: string; value: unknown; encoded?: string; onCopy: (value: string, label: string) => void }) {
  const formatted = JSON.stringify(value, null, 2)
  return (
    <Panel className="jwt-json-card">
      <div className="panel-header">
        <div>
          <span className="jwt-card-kicker">Decoded section</span>
          <h2>{title}</h2>
        </div>
        <CopyIconButton value={formatted} label={title} onCopy={onCopy} />
      </div>
      <pre>{formatted}</pre>
      {encoded && <details className="jwt-encoded"><summary>Encoded Base64URL</summary><code>{encoded}</code></details>}
    </Panel>
  )
}

function VerificationChecks({ result }: { result: VerificationResult }) {
  return (
    <div className="jwt-check-list">
      {result.checks.map((check) => (
        <div className={`jwt-check jwt-check-${check.state}`} key={check.label}>
          {check.state === 'pass' ? <CheckCircle2 size={18} /> : check.state === 'fail' ? <XCircle size={18} /> : <Info size={18} />}
          <div><strong>{check.label}</strong><span>{check.detail}</span></div>
        </div>
      ))}
    </div>
  )
}

export function JwtDecoderPage() {
  const [tab, setTab] = useState<Tab>('inspect')
  const [input, setInput] = useState(() => sessionStorage.getItem('toolstack.jwtDecoder.input') ?? '')
  const [comparisonInput, setComparisonInput] = useState('')
  const [keyMaterial, setKeyMaterial] = useState('')
  const [jwksUrl, setJwksUrl] = useState('')
  const [expectedIssuer, setExpectedIssuer] = useState('')
  const [expectedAudience, setExpectedAudience] = useState('')
  const [verification, setVerification] = useState<VerificationResult>()
  const [verificationError, setVerificationError] = useState('')
  const [verificationInput, setVerificationInput] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [builderHeader, setBuilderHeader] = useState(defaultBuilderHeader)
  const [builderPayload, setBuilderPayload] = useState(defaultBuilderPayload)
  const [builderSecret, setBuilderSecret] = useState(demoSecret)
  const [builtToken, setBuiltToken] = useState('')
  const [builderError, setBuilderError] = useState('')
  const dispatch = useAppDispatch()

  const decoded = useMemo(() => tryParseJwt(input), [input])
  const comparison = useMemo(() => tryParseJwt(comparisonInput), [comparisonInput])
  const differences = useMemo(() => decoded.token && comparison.token
    ? compareJwtPayloads(decoded.token.payload, comparison.token.payload)
    : [], [comparison.token, decoded.token])
  const algorithm = typeof decoded.token?.header.alg === 'string' ? decoded.token.header.alg : ''
  const isHmac = algorithm.startsWith('HS')
  const lifetime = decoded.token ? tokenLifetime(decoded.token.payload) : undefined

  useEffect(() => {
    if (input) sessionStorage.setItem('toolstack.jwtDecoder.input', input)
    else sessionStorage.removeItem('toolstack.jwtDecoder.input')
  }, [input])

  async function copy(value: string, label: string) {
    try {
      await clipboardService.copy(value)
      dispatch(addNotification(`${label} copied to clipboard.`, 'success'))
    } catch {
      dispatch(addNotification(`Unable to copy ${label.toLowerCase()}.`, 'error'))
    }
  }

  async function loadExample() {
    const token = await signHsJwt(defaultBuilderHeader, defaultBuilderPayload(), demoSecret)
    setInput(token)
    setKeyMaterial(demoSecret)
  }

  function resetInspector() {
    setInput('')
    setKeyMaterial('')
    setJwksUrl('')
    setExpectedIssuer('')
    setExpectedAudience('')
    setVerification(undefined)
    setVerificationError('')
  }

  async function runVerification(useJwks = false) {
    if (!decoded.token) return
    setVerificationInput(decoded.token.raw)
    setIsVerifying(true)
    setVerification(undefined)
    setVerificationError('')
    try {
      const key = useJwks ? await fetchJwksKey(jwksUrl, decoded.token) : parseManualKey(keyMaterial, isHmac)
      const result = await verifyJwt(
        decoded.token,
        key,
        expectedIssuer.trim(),
        expectedAudience.trim(),
        useJwks ? 'jwks' : isHmac ? 'secret' : 'public-key',
      )
      setVerification(result)
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : 'Unable to verify this token.')
    } finally {
      setIsVerifying(false)
    }
  }

  async function createToken() {
    setBuilderError('')
    try {
      setBuiltToken(await signHsJwt(builderHeader, builderPayload, builderSecret))
    } catch (error) {
      setBuiltToken('')
      setBuilderError(error instanceof Error ? error.message : 'Unable to create this token.')
    }
  }

  function editCurrentToken(token: ParsedJwt) {
    setBuilderHeader(JSON.stringify(token.header, null, 2))
    setBuilderPayload(JSON.stringify(token.payload, null, 2))
    setBuiltToken('')
    setBuilderError('')
    setTab('create')
  }

  function inspectBuiltToken() {
    setInput(builtToken)
    setKeyMaterial(builderSecret)
    setTab('inspect')
  }

  function downloadReport(token: ParsedJwt) {
    const report = {
      header: token.header,
      payload: token.payload,
      signature: token.encodedSignature,
      status: token.status,
      sizes: token.sizes,
      warnings: token.warnings,
      notice: 'Decoded data is not trusted unless signature verification succeeds.',
    }
    downloadTextFile('jwt-inspection.json', JSON.stringify(report, null, 2))
    dispatch(addNotification('JWT inspection downloaded.', 'success'))
  }

  return (
    <section className="tool-workspace jwt-workspace -mt-[18px] -mb-5 grid w-full max-w-none content-start gap-2.5 pb-1">
      <div className="jwt-topbar">
        <div className="jwt-security-note">
          <LockKeyhole size={18} />
          <div><strong>JWT payloads are readable, not encrypted.</strong><span>Avoid pasting live production tokens. JWKS verification is the only feature that makes a network request.</span></div>
        </div>

        <nav className="jwt-tabs" aria-label="JWT tools">
          <button className={tab === 'inspect' ? 'active' : ''} onClick={() => setTab('inspect')}><Braces size={17} />Inspect</button>
          <button className={tab === 'compare' ? 'active' : ''} onClick={() => setTab('compare')}><GitCompareArrows size={17} />Compare</button>
          <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}><WandSparkles size={17} />Create test token</button>
          <button className={tab === 'guide' ? 'active' : ''} onClick={() => setTab('guide')}><BookOpen size={17} />Guide</button>
        </nav>
      </div>

      {tab === 'inspect' && (
        <>
          <Panel className="jwt-input-panel">
            <div className="panel-header">
              <div><span className="jwt-card-kicker">Token input</span><h2>Paste a JWT</h2></div>
              <div className="jwt-inline-actions">
                <Button variant="ghost" onClick={() => void loadExample()}><Sparkles size={16} />Example</Button>
                <Button variant="ghost" onClick={resetInspector}><RefreshCcw size={16} />Reset</Button>
              </div>
            </div>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Paste a JWT, Bearer token, or Authorization: Bearer value…" spellCheck={false} />
            {decoded.error && <div className="validation-message validation-error"><XCircle size={17} /><strong>Cannot decode</strong><span>{decoded.error}</span></div>}
            {!input && <div className="jwt-input-help"><p className="jwt-helper">The decoder accepts a raw JWT, <code>Bearer eyJ…</code>, or a complete Authorization header.</p><Button className="!min-h-7 !px-2 !py-1" variant="ghost" onClick={() => setTab('guide')}><BookOpen size={14} />Open beginner guide</Button></div>}
          </Panel>

          {decoded.token && <JwtInspection
            token={decoded.token}
            lifetime={lifetime}
            algorithm={algorithm}
            isHmac={isHmac}
            keyMaterial={keyMaterial}
            setKeyMaterial={setKeyMaterial}
            jwksUrl={jwksUrl}
            setJwksUrl={setJwksUrl}
            expectedIssuer={expectedIssuer}
            setExpectedIssuer={setExpectedIssuer}
            expectedAudience={expectedAudience}
            setExpectedAudience={setExpectedAudience}
            verification={verificationInput === decoded.token.raw ? verification : undefined}
            verificationError={verificationInput === decoded.token.raw ? verificationError : ''}
            isVerifying={isVerifying}
            onVerify={runVerification}
            onCopy={copy}
            onEdit={editCurrentToken}
            onDownload={downloadReport}
          />}
        </>
      )}

      {tab === 'compare' && (
        <CompareTokens
          firstInput={input}
          setFirstInput={setInput}
          first={decoded}
          secondInput={comparisonInput}
          setSecondInput={setComparisonInput}
          second={comparison}
          differences={differences}
        />
      )}

      {tab === 'create' && (
        <TokenBuilder
          header={builderHeader}
          setHeader={setBuilderHeader}
          payload={builderPayload}
          setPayload={setBuilderPayload}
          secret={builderSecret}
          setSecret={setBuilderSecret}
          token={builtToken}
          error={builderError}
          onCreate={createToken}
          onCopy={copy}
          onInspect={inspectBuiltToken}
        />
      )}

      {tab === 'guide' && <JwtGuide onStart={() => { void loadExample(); setTab('inspect') }} onCreate={() => setTab('create')} />}
    </section>
  )
}

function JwtGuide({ onStart, onCreate }: { onStart: () => void; onCreate: () => void }) {
  const features = [
    { icon: <Braces size={19} />, title: 'Decode and inspect', text: 'Paste a raw JWT, Bearer token, or Authorization header to see its header, payload, signature, size, and readable dates.' },
    { icon: <Clock3 size={19} />, title: 'Understand token status', text: 'See whether a token is active, expired, not active yet, issued in the future, or missing an expiration time.' },
    { icon: <ShieldAlert size={19} />, title: 'Review security warnings', text: 'Detect unsigned tokens, sensitive-looking claims, long lifetimes, missing signatures, and unusually large tokens.' },
    { icon: <ShieldCheck size={19} />, title: 'Verify trust', text: 'Check HS, RS, PS, or ES signatures and optionally validate the expected issuer and audience.' },
    { icon: <KeyRound size={19} />, title: 'Use public keys or JWKS', text: 'Paste a PEM/JWK public key or enter an issuer/JWKS URL. The matching key is selected using the token kid.' },
    { icon: <GitCompareArrows size={19} />, title: 'Compare two tokens', text: 'See added, removed, and changed payload claims without being distracted by signature differences.' },
    { icon: <WandSparkles size={19} />, title: 'Create test tokens', text: 'Build and re-sign development-only HMAC tokens to test roles, permissions, expiration, and validation behavior.' },
    { icon: <Download size={19} />, title: 'Copy or export', text: 'Copy individual sections or download a JSON inspection report containing claims, sizes, status, and warnings.' },
  ]
  const claims = [
    ['iss', 'Issuer', 'Who created the token'],
    ['sub', 'Subject', 'The user or entity represented by it'],
    ['aud', 'Audience', 'Which application or API should accept it'],
    ['iat', 'Issued at', 'When the token was created'],
    ['exp', 'Expiration', 'When the token stops being valid'],
    ['nbf', 'Not before', 'When the token becomes active'],
    ['jti', 'JWT ID', 'A unique identifier for the token'],
    ['scope', 'Scope', 'Permissions granted by the token'],
  ]
  return (
    <div className="jwt-guide">
      <Panel className="jwt-guide-hero">
        <div className="jwt-guide-hero-icon"><BookOpen size={28} /></div>
        <div><span className="jwt-card-kicker">Beginner guide</span><h2>What is a JWT?</h2><p>A JSON Web Token is a compact string used to carry claims between systems. It has three dot-separated sections: a header, a payload, and a signature.</p></div>
        <div className="jwt-token-anatomy" aria-label="JWT structure">
          <span><strong>Header</strong><small>Algorithm and token type</small></span><b>.</b>
          <span><strong>Payload</strong><small>User and authorization claims</small></span><b>.</b>
          <span><strong>Signature</strong><small>Detects signed-data changes</small></span>
        </div>
        <div className="jwt-guide-warning"><AlertTriangle size={18} /><div><strong>JWTs are usually signed, not encrypted.</strong><span>Anyone holding a token can decode its payload. Never store passwords, private keys, or other secrets inside it.</span></div></div>
      </Panel>

      <Panel>
        <div className="panel-header"><div><span className="jwt-card-kicker">Quick start</span><h2>Inspect your first token</h2></div></div>
        <div className="jwt-guide-steps">
          <div><span>1</span><strong>Open Inspect</strong><small>Paste a token or click Example.</small></div>
          <div><span>2</span><strong>Read the claims</strong><small>Check identity, permissions, and dates.</small></div>
          <div><span>3</span><strong>Review warnings</strong><small>Look for expiry or unsafe content.</small></div>
          <div><span>4</span><strong>Verify it</strong><small>Use the correct secret or public key.</small></div>
        </div>
        <div className="jwt-guide-actions"><Button onClick={onStart}><Sparkles size={16} />Try the example</Button><Button variant="secondary" onClick={onCreate}><WandSparkles size={16} />Create a test token</Button></div>
      </Panel>

      <Panel>
        <div className="panel-header"><div><span className="jwt-card-kicker">Everything available</span><h2>Feature guide</h2></div></div>
        <div className="jwt-feature-guide-grid">{features.map((feature) => <div className="jwt-feature-guide-card" key={feature.title}><span>{feature.icon}</span><div><strong>{feature.title}</strong><p>{feature.text}</p></div></div>)}</div>
      </Panel>

      <div className="jwt-guide-two-column">
        <Panel>
          <div className="panel-header"><div><span className="jwt-card-kicker">Status reference</span><h2>What each status means</h2></div></div>
          <div className="jwt-status-guide">
            <div className="jwt-guide-status-active"><strong>Active</strong><span>The token is inside its declared validity window.</span></div>
            <div className="jwt-guide-status-expired"><strong>Expired</strong><span>The current time is after its <code>exp</code> value.</span></div>
            <div className="jwt-guide-status-not-active"><strong>Not active yet</strong><span>The current time is before its <code>nbf</code> value.</span></div>
            <div className="jwt-guide-status-future"><strong>Future issued</strong><span>The <code>iat</code> value is unexpectedly ahead of this device.</span></div>
            <div className="jwt-guide-status-no-expiration"><strong>No expiration</strong><span>The payload does not contain an <code>exp</code> claim.</span></div>
          </div>
        </Panel>

        <Panel>
          <div className="panel-header"><div><span className="jwt-card-kicker">Claim reference</span><h2>Common payload fields</h2></div></div>
          <div className="jwt-claim-guide">{claims.map(([claim, name, meaning]) => <div key={claim}><code>{claim}</code><strong>{name}</strong><span>{meaning}</span></div>)}</div>
        </Panel>
      </div>

      <Panel className="jwt-trust-guide">
        <ShieldCheck size={24} />
        <div><span className="jwt-card-kicker">The most important rule</span><h2>Decoded does not mean trusted</h2><p>Decoding only reveals the data. A token should be trusted only after its signature, time window, issuer, and audience have been validated for your application.</p></div>
        <Button onClick={onStart}>Start inspecting<ArrowRight size={16} /></Button>
      </Panel>
    </div>
  )
}

function parseManualKey(value: string, isHmac: boolean): string | JsonWebKey {
  if (isHmac) return value
  if (!value.trim()) throw new Error('Paste a PEM public key or public JWK.')
  if (!value.trim().startsWith('{')) return value
  const parsed = JSON.parse(value) as unknown
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('The public JWK must be a JSON object.')
  return parsed as JsonWebKey
}

type InspectionProps = {
  token: ParsedJwt
  lifetime?: number
  algorithm: string
  isHmac: boolean
  keyMaterial: string
  setKeyMaterial: (value: string) => void
  jwksUrl: string
  setJwksUrl: (value: string) => void
  expectedIssuer: string
  setExpectedIssuer: (value: string) => void
  expectedAudience: string
  setExpectedAudience: (value: string) => void
  verification?: VerificationResult
  verificationError: string
  isVerifying: boolean
  onVerify: (useJwks?: boolean) => Promise<void>
  onCopy: (value: string, label: string) => void
  onEdit: (token: ParsedJwt) => void
  onDownload: (token: ParsedJwt) => void
}

function JwtInspection(props: InspectionProps) {
  const { token } = props
  const [now] = useState(() => Date.now() / 1000)
  const status = statusCopy(token.status)
  const expiresAt = typeof token.payload.exp === 'number' ? token.payload.exp : undefined
  return (
    <div className="jwt-results">
      <div className="jwt-summary-grid">
        <div className={`jwt-summary-card jwt-status-${token.status}`}><Clock3 /><span>Token status</span><strong>{status.label}</strong><small>{status.detail}</small></div>
        <div className="jwt-summary-card"><FileKey2 /><span>Algorithm</span><strong>{props.algorithm || 'Missing'}</strong><small>{typeof token.header.kid === 'string' ? `Key ID: ${token.header.kid}` : 'No key ID declared'}</small></div>
        <div className="jwt-summary-card"><Braces /><span>Token size</span><strong>{token.sizes.total.toLocaleString()} bytes</strong><small>{token.sizes.header} header · {token.sizes.payload} payload · {token.sizes.signature} signature</small></div>
        <div className="jwt-summary-card"><Clock3 /><span>{expiresAt ? 'Expiration' : 'Lifetime'}</span><strong>{expiresAt ? formatTimestamp(expiresAt) : 'Not declared'}</strong><small>{expiresAt ? (expiresAt > now ? `Expires in ${formatDuration(expiresAt - now)}` : `Expired ${formatDuration(now - expiresAt)} ago`) : props.lifetime !== undefined ? formatDuration(props.lifetime) : 'Add exp to limit validity'}</small></div>
      </div>

      <div className="jwt-json-grid">
        <JsonSection title="Header" value={token.header} encoded={token.encodedHeader} onCopy={props.onCopy} />
        <JsonSection title="Payload" value={token.payload} encoded={token.encodedPayload} onCopy={props.onCopy} />
        <Panel className="jwt-json-card jwt-signature-card">
          <div className="panel-header"><div><span className="jwt-card-kicker">Encoded section</span><h2>Signature</h2></div><CopyIconButton value={token.encodedSignature} label="signature" onCopy={props.onCopy} /></div>
          <pre>{token.encodedSignature}</pre>
          <p className="jwt-helper"><ShieldAlert size={15} /> Decoding alone does not prove that this signature is valid.</p>
        </Panel>
      </div>

      <Panel>
        <div className="panel-header"><div><span className="jwt-card-kicker">Payload details</span><h2>Claims</h2></div><span className="jwt-count-pill">{Object.keys(token.payload).length} claims</span></div>
        <div className="jwt-claims-table">
          {Object.entries(token.payload).map(([claim, value]) => (
            <div className="jwt-claim-row" key={claim}>
              <code>{claim}</code>
              <div>
                {permissionItems(claim, value).length
                  ? <div className="jwt-permission-list">{permissionItems(claim, value).map((item) => <span key={item}>{item}</span>)}</div>
                  : <strong>{displayValue(value)}</strong>}
                {isTimeClaim(claim, value) && <span>{formatTimestamp(value)}</span>}
              </div>
              <span>{getClaimDescription(claim)}</span>
            </div>
          ))}
        </div>
        <div className="jwt-identity-grid">
          <div><span>Issuer</span><strong>{typeof token.payload.iss === 'string' ? token.payload.iss : 'Not provided'}</strong></div>
          <div><span>Audience</span><strong>{audienceText(token.payload.aud)}</strong></div>
          <div><span>Subject</span><strong>{typeof token.payload.sub === 'string' ? token.payload.sub : 'Not provided'}</strong></div>
          <div><span>Declared lifetime</span><strong>{props.lifetime !== undefined ? formatDuration(props.lifetime) : 'Unavailable'}</strong></div>
        </div>
      </Panel>

      <Panel>
        <div className="panel-header"><div><span className="jwt-card-kicker">Automated review</span><h2>Security diagnostics</h2></div><span className="jwt-count-pill">{token.warnings.length || 'No'} findings</span></div>
        {token.warnings.length ? <div className="jwt-warning-grid">{token.warnings.map((warning) => (
          <div className={`jwt-warning jwt-warning-${warning.level}`} key={`${warning.title}-${warning.message}`}>
            {warning.level === 'danger' ? <ShieldAlert size={19} /> : warning.level === 'warning' ? <AlertTriangle size={19} /> : <Info size={19} />}
            <div><strong>{warning.title}</strong><span>{warning.message}</span></div>
          </div>
        ))}</div> : <div className="jwt-empty-success"><CheckCircle2 size={20} />No obvious structural or claim warnings were found. Signature verification is still required.</div>}
      </Panel>

      <Panel className="jwt-verification-panel">
        <div className="panel-header"><div><span className="jwt-card-kicker">Cryptographic validation</span><h2>Verify signature and context</h2></div><KeyRound size={22} /></div>
        <p className="jwt-helper">Verification checks that the signed content matches a key. Expected issuer and audience checks confirm that the token belongs to your application.</p>
        <div className="jwt-verification-grid">
          <label className="jwt-field jwt-key-field"><span>{props.isHmac ? 'Shared HMAC secret' : 'PEM public key or public JWK'}</span><textarea value={props.keyMaterial} onChange={(event) => props.setKeyMaterial(event.target.value)} placeholder={props.isHmac ? 'Enter the secret used to sign this token…' : '-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----'} spellCheck={false} /></label>
          <label className="jwt-field"><span>Expected issuer <small>optional</small></span><Input value={props.expectedIssuer} onChange={(event) => props.setExpectedIssuer(event.target.value)} placeholder="https://auth.example.com" /></label>
          <label className="jwt-field"><span>Expected audience <small>optional</small></span><Input value={props.expectedAudience} onChange={(event) => props.setExpectedAudience(event.target.value)} placeholder="toolstack-web" /></label>
        </div>
        {props.isHmac && props.keyMaterial && props.keyMaterial.length < 32 && <div className="jwt-inline-warning"><AlertTriangle size={16} />This HMAC secret is short. Production HS256 secrets should contain at least 32 unpredictable bytes.</div>}
        <div className="jwt-verification-actions"><Button disabled={props.isVerifying} onClick={() => void props.onVerify()}><ShieldCheck size={17} />{props.isVerifying ? 'Verifying…' : `Verify ${props.algorithm || 'signature'}`}</Button></div>

        {!props.isHmac && <div className="jwt-jwks-box">
          <div><strong>Or verify with an issuer or JWKS endpoint</strong><span>The decoder discovers the JWKS when needed and selects the public key matching the token’s <code>kid</code>.</span></div>
          <div className="jwt-jwks-row"><Input value={props.jwksUrl} onChange={(event) => props.setJwksUrl(event.target.value)} placeholder="https://issuer.example.com or …/.well-known/jwks.json" /><Button variant="secondary" disabled={props.isVerifying} onClick={() => void props.onVerify(true)}>Fetch &amp; verify</Button></div>
          <small>This sends a request to the URL above. The token itself is not included in that request.</small>
        </div>}

        {props.verificationError && <div className="validation-message validation-error"><XCircle size={17} /><strong>Verification failed</strong><span>{props.verificationError}</span></div>}
        {props.verification && <div className={`jwt-verification-result ${props.verification.verified ? 'verified' : 'rejected'}`}>
          <div className="jwt-verification-title">{props.verification.verified ? <CheckCircle2 /> : <XCircle />}<div><strong>{props.verification.verified ? 'Token verified' : 'Token not accepted'}</strong><span>Key source: {props.verification.keySource.replace('-', ' ')}</span></div></div>
          <VerificationChecks result={props.verification} />
        </div>}
      </Panel>

      <div className="jwt-footer-actions">
        <Button variant="secondary" onClick={() => props.onEdit(token)}><WandSparkles size={16} />Edit &amp; re-sign payload</Button>
        <Button variant="secondary" onClick={() => props.onDownload(token)}><Download size={16} />Download report</Button>
        <Button variant="ghost" onClick={() => props.onCopy(token.raw, 'token')}><Copy size={16} />Copy token</Button>
      </div>
    </div>
  )
}

type ParsedState = ReturnType<typeof tryParseJwt>

function CompareTokens({ firstInput, setFirstInput, first, secondInput, setSecondInput, second, differences }: {
  firstInput: string
  setFirstInput: (value: string) => void
  first: ParsedState
  secondInput: string
  setSecondInput: (value: string) => void
  second: ParsedState
  differences: ReturnType<typeof compareJwtPayloads>
}) {
  return (
    <div className="jwt-results">
      <div className="jwt-compare-grid">
        <Panel><div className="panel-header"><div><span className="jwt-card-kicker">Original</span><h2>First token</h2></div>{first.token && <CheckCircle2 className="jwt-valid-icon" size={19} />}</div><textarea value={firstInput} onChange={(event) => setFirstInput(event.target.value)} placeholder="Paste the first JWT…" spellCheck={false} />{first.error && <p className="jwt-field-error">{first.error}</p>}</Panel>
        <Panel><div className="panel-header"><div><span className="jwt-card-kicker">Changed</span><h2>Second token</h2></div>{second.token && <CheckCircle2 className="jwt-valid-icon" size={19} />}</div><textarea value={secondInput} onChange={(event) => setSecondInput(event.target.value)} placeholder="Paste the second JWT…" spellCheck={false} />{second.error && <p className="jwt-field-error">{second.error}</p>}</Panel>
      </div>
      {first.token && second.token ? <Panel>
        <div className="panel-header"><div><span className="jwt-card-kicker">Payload comparison</span><h2>{differences.length ? `${differences.length} ${differences.length === 1 ? 'difference' : 'differences'}` : 'Payloads match'}</h2></div><GitCompareArrows size={22} /></div>
        {differences.length ? <div className="jwt-difference-list">{differences.map((difference) => <div className={`jwt-difference jwt-difference-${difference.kind}`} key={`${difference.kind}-${difference.path}`}>
          <span className="jwt-difference-symbol">{difference.kind === 'added' ? '+' : difference.kind === 'removed' ? '−' : '~'}</span>
          <code>{difference.path}</code>
          <div>{difference.kind !== 'added' && <span><small>Before</small><strong>{displayValue(difference.before)}</strong></span>}{difference.kind === 'changed' && <ArrowRight size={15} />}{difference.kind !== 'removed' && <span><small>After</small><strong>{displayValue(difference.after)}</strong></span>}</div>
        </div>)}</div> : <div className="jwt-empty-success"><CheckCircle2 size={20} />Both tokens contain the same payload data.</div>}
      </Panel> : <div className="jwt-empty-state"><GitCompareArrows size={30} /><strong>Add two valid JWTs to compare their payload claims.</strong><span>Signature values are intentionally ignored because signatures normally change whenever token data changes.</span></div>}
    </div>
  )
}

function TokenBuilder({ header, setHeader, payload, setPayload, secret, setSecret, token, error, onCreate, onCopy, onInspect }: {
  header: string
  setHeader: (value: string) => void
  payload: string
  setPayload: (value: string) => void
  secret: string
  setSecret: (value: string) => void
  token: string
  error: string
  onCreate: () => Promise<void>
  onCopy: (value: string, label: string) => void
  onInspect: () => void
}) {
  return (
    <div className="jwt-results">
      <div className="jwt-builder-note"><Info size={18} /><div><strong>For development and testing only</strong><span>This builder creates HMAC-signed test tokens. Never put a production signing secret in frontend source code.</span></div></div>
      <div className="jwt-builder-grid">
        <Panel><div className="panel-header"><div><span className="jwt-card-kicker">JSON</span><h2>Header</h2></div></div><textarea value={header} onChange={(event) => setHeader(event.target.value)} spellCheck={false} /></Panel>
        <Panel><div className="panel-header"><div><span className="jwt-card-kicker">JSON</span><h2>Payload</h2></div></div><textarea value={payload} onChange={(event) => setPayload(event.target.value)} spellCheck={false} /></Panel>
      </div>
      <Panel>
        <label className="jwt-field"><span>Test signing secret</span><Input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Use a development-only secret…" /></label>
        {secret && secret.length < 32 && <div className="jwt-inline-warning"><AlertTriangle size={16} />Use at least 32 unpredictable bytes when testing HS256 strength.</div>}
        <div className="jwt-verification-actions"><Button onClick={() => void onCreate()}><WandSparkles size={17} />Create signed token</Button></div>
        {error && <div className="validation-message validation-error"><XCircle size={17} /><strong>Cannot create token</strong><span>{error}</span></div>}
      </Panel>
      {token && <Panel className="jwt-built-token"><div className="panel-header"><div><span className="jwt-card-kicker">Signed output</span><h2>Test JWT</h2></div><CopyIconButton value={token} label="token" onCopy={onCopy} /></div><pre>{token}</pre><div className="jwt-footer-actions"><Button onClick={onInspect}><ShieldCheck size={16} />Inspect and verify</Button><Button variant="secondary" onClick={() => onCopy(token, 'token')}><Copy size={16} />Copy token</Button></div></Panel>}
    </div>
  )
}
