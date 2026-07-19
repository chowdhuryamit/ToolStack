import { CheckCircle2, Copy, Download, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { clipboardService } from '../../../../services/clipboardService'
import { downloadTextFile } from '../../../../services/downloadService'
import { useAppDispatch } from '../../../../store/hooks'
import { addNotification } from '../../../../store/slices/notificationSlice'
import { useRegexTester, type RegexTesterPreset } from '../hooks/useRegexTester'
import { REGEX_FLAGS, type RegexMatch, type RegexTestResult } from '../types'

const TEST_RECIPES: Array<RegexTesterPreset & { title: string; description: string }> = [
  {
    title: 'Global matches',
    description: 'Find every word and verify match highlighting and positions.',
    pattern: '\\b\\w+\\b',
    text: 'Test every regex match in this sentence.',
    flags: ['g'],
  },
  {
    title: 'Ignore case',
    description: 'Match the same word regardless of capitalization.',
    pattern: 'toolstack',
    text: 'ToolStack TOOLSTACK toolstack',
    flags: ['g', 'i'],
  },
  {
    title: 'Multiline anchors',
    description: 'Use ^ and $ against each individual line.',
    pattern: '^Error:.*$',
    text: 'Info: Started\nError: First failure\nError: Second failure',
    flags: ['g', 'm'],
  },
  {
    title: 'Dot-all matching',
    description: 'Allow the dot character to match across line breaks.',
    pattern: '<section>.*</section>',
    text: '<section>first line\nsecond line</section>',
    flags: ['g', 's'],
  },
  {
    title: 'Unicode',
    description: 'Use a Unicode property escape to find emoji.',
    pattern: '\\p{Extended_Pictographic}',
    text: 'Regex is useful 🔎 and fast ⚡ when patterns are safe.',
    flags: ['g', 'u'],
  },
  {
    title: 'Numbered groups',
    description: 'Swap last and first names with $1 and $2.',
    pattern: '(\\w+),\\s*(\\w+)',
    text: 'Doe, Jane\nSmith, Alex',
    flags: ['g'],
    replacement: '$2 $1',
  },
  {
    title: 'Named groups + indices',
    description: 'Inspect named captures, indices, and named replacement tokens.',
    pattern: '(?<key>\\w+)=(?<value>\\w+)',
    text: 'theme=dark mode=compact',
    flags: ['g', 'd'],
    replacement: '$<key>: $<value>',
  },
  {
    title: 'Sticky matching',
    description: 'Match only at the current starting position with the y flag.',
    pattern: '\\w+',
    text: 'alpha beta',
    flags: ['y'],
  },
]

function buildReport(pattern: string, flags: string, result: RegexTestResult) {
  const header = `/${pattern}/${flags}\n${result.matches.length} match${result.matches.length === 1 ? '' : 'es'}`
  if (!result.matches.length) return `${header}\n\nNo matches found.`

  const matches = result.matches.map((match, index) => {
    const captures = match.captures.map((capture) =>
      `    Group ${capture.number}: ${capture.value === undefined ? 'unmatched' : JSON.stringify(capture.value)}${capture.index === undefined ? '' : ` at ${capture.index}–${capture.end}`}`,
    )
    const named = Object.entries(match.namedGroups).map(([name, value]) =>
      `    ${name}: ${value === undefined ? 'unmatched' : JSON.stringify(value)}`,
    )
    return [
      `${index + 1}. ${JSON.stringify(match.value)} at ${match.index}–${match.end}`,
      ...captures,
      ...named,
    ].join('\n')
  })

  return `${header}\n\n${matches.join('\n\n')}`
}

function HighlightedText({ text, matches }: { text: string; matches: RegexMatch[] }) {
  if (!text) return <span className="regex-preview-empty">Enter test text to see matches highlighted here.</span>

  const parts: ReactNode[] = []
  let cursor = 0

  matches.forEach((match, index) => {
    if (match.end <= match.index) return
    if (match.index > cursor) parts.push(text.slice(cursor, match.index))
    parts.push(<mark className={`regex-highlight regex-highlight-${index % 5}`} key={`${match.index}-${index}`}>{text.slice(match.index, match.end)}</mark>)
    cursor = match.end
  })

  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}

export function RegexTesterPage() {
  const tester = useRegexTester()
  const dispatch = useAppDispatch()
  const hasValidResult = Boolean(tester.result && !tester.result.error)
  const report = tester.result && !tester.result.error
    ? buildReport(tester.pattern, tester.flagString, tester.result)
    : ''

  async function copyResults() {
    try {
      await clipboardService.copy(report)
      dispatch(addNotification('Regex results copied to clipboard.', 'success'))
    } catch {
      dispatch(addNotification('Unable to copy the regex results.', 'error'))
    }
  }

  function downloadResults() {
    downloadTextFile('regex-matches.txt', report)
    dispatch(addNotification('Regex results downloaded.', 'success'))
  }

  async function copyReplacement() {
    try {
      await clipboardService.copy(tester.replacementOutput ?? '')
      dispatch(addNotification('Replacement output copied to clipboard.', 'success'))
    } catch {
      dispatch(addNotification('Unable to copy the replacement output.', 'error'))
    }
  }

  function downloadReplacement() {
    downloadTextFile('regex-replacement.txt', tester.replacementOutput ?? '')
    dispatch(addNotification('Replacement output downloaded.', 'success'))
  }

  return (
    <section className="page-stack tool-workspace regex-workspace">
      {tester.result?.error && (
        <div className="validation-message validation-error" role="alert">
          <TriangleAlert size={17} />
          <strong>Invalid expression</strong>
          <span>{tester.result.error}</span>
        </div>
      )}
      {hasValidResult && (
        <div className="validation-message validation-success" role="status">
          <CheckCircle2 size={17} />
          <span>
            Valid expression · {tester.result?.matches.length ?? 0} match{tester.result?.matches.length === 1 ? '' : 'es'} · {tester.result?.duration.toFixed(2)} ms
            {tester.result?.truncated ? ' · Results limited to 5,000 matches' : ''}
          </span>
        </div>
      )}

      <section className="tool-panel regex-expression-panel">
        <div className="panel-header">
          <h2>Expression</h2>
          <Button variant="ghost" onClick={tester.loadExample}><Sparkles size={16} />Example</Button>
        </div>
        <div className="regex-expression-layout">
          <div className="regex-pattern-block">
            <label className="utility-label" htmlFor="regex-pattern">Regular expression</label>
            <div className="regex-pattern-row">
              <span aria-hidden="true">/</span>
              <Input
                id="regex-pattern"
                className="regex-pattern-input"
                value={tester.pattern}
                onChange={(event) => tester.setPattern(event.target.value)}
                placeholder="e.g. \\b[A-Z][a-z]+\\b"
                spellCheck={false}
              />
              <span aria-label={`Active flags: ${tester.flagString || 'none'}`}>/{tester.flagString}</span>
            </div>
          </div>
          <fieldset className="regex-flags">
            <legend>Flags</legend>
            {REGEX_FLAGS.map((flag) => (
              <button
                className="regex-flag"
                type="button"
                key={flag.value}
                aria-pressed={tester.flags.includes(flag.value)}
                title={flag.description}
                onClick={() => tester.toggleFlag(flag.value)}
              >
                <code>{flag.value}</code>
                <span>{flag.label}</span>
              </button>
            ))}
          </fieldset>
        </div>
      </section>

      <div className="regex-grid">
        <section className="tool-panel regex-input-panel">
          <div className="panel-header">
            <h2>Test &amp; replace</h2>
            <span className="regex-live-hint">Updates automatically</span>
          </div>
          <label className="utility-label" htmlFor="regex-test-text">Test text</label>
          <textarea
            id="regex-test-text"
            className="utility-textarea regex-test-text"
            value={tester.text}
            onChange={(event) => tester.setText(event.target.value)}
            placeholder="Enter the text you want to test…"
            spellCheck={false}
          />

          <div className="regex-replacement-heading">
            <label className="utility-label" htmlFor="regex-replacement">Replacement</label>
            <button
              className="regex-replacement-toggle"
              type="button"
              aria-pressed={tester.replacementEnabled}
              onClick={() => tester.setReplacementEnabled(!tester.replacementEnabled)}
            >
              Enable replacement
            </button>
          </div>
          <Input
            id="regex-replacement"
            className="regex-pattern-input"
            value={tester.replacement}
            onChange={(event) => tester.setReplacement(event.target.value)}
            placeholder="e.g. [$1] or $<name>"
            spellCheck={false}
          />
          <p className="regex-replacement-help">
            Supports JavaScript substitutions: <code>$&amp;</code> full match, <code>$1</code> capture, <code>$&lt;name&gt;</code> named capture, and <code>$$</code> dollar sign.
          </p>

          <div className="utility-actions">
            <Button variant="ghost" onClick={tester.reset}><RotateCcw size={16} />Reset</Button>
          </div>
        </section>

        <section className="tool-panel regex-results-panel">
          <div className="panel-header">
            <div>
              <h2>Matches</h2>
              <p className="muted">{hasValidResult ? `${tester.result?.matches.length ?? 0} found` : 'Waiting for a valid expression'}</p>
            </div>
            <div className="output-actions">
              <Button variant="secondary" disabled={!hasValidResult} onClick={() => void copyResults()}><Copy size={16} />Copy</Button>
              <Button variant="secondary" disabled={!hasValidResult} onClick={downloadResults}><Download size={16} />Download</Button>
            </div>
          </div>

          <div className="regex-preview" aria-label="Highlighted match preview">
            <HighlightedText text={tester.text} matches={tester.result?.matches ?? []} />
          </div>

          {tester.replacementEnabled && (
            <section className="regex-replacement-output">
              <div className="regex-replacement-output-heading">
                <div>
                  <h3>Replacement preview</h3>
                  <p className="muted">Uses JavaScript replacement-string syntax</p>
                </div>
                <div className="output-actions">
                  <Button variant="secondary" disabled={tester.replacementOutput === undefined} onClick={() => void copyReplacement()}><Copy size={16} />Copy</Button>
                  <Button variant="secondary" disabled={tester.replacementOutput === undefined} onClick={downloadReplacement}><Download size={16} />Download</Button>
                </div>
              </div>
              <pre className="regex-replacement-preview">
                {tester.replacementOutput === undefined ? 'Enter a valid expression to preview the replacement.' : tester.replacementOutput || '(empty output)'}
              </pre>
            </section>
          )}

          <div className="regex-match-list" aria-live="polite">
            {!tester.pattern && <p className="regex-empty-state">Enter a regular expression to begin testing.</p>}
            {hasValidResult && !tester.result?.matches.length && <p className="regex-empty-state">No matches found.</p>}
            {tester.result?.matches.map((match, index) => (
              <article className="regex-match-card" key={`${match.index}-${index}`}>
                <div className="regex-match-heading">
                  <strong>Match {index + 1}</strong>
                  <span>index {match.index}–{match.end}</span>
                </div>
                <code className="regex-match-value">{match.value || '(empty match)'}</code>

                {match.captures.length > 0 && (
                  <div className="regex-group-list">
                    <span className="regex-group-title">Capture groups</span>
                    {match.captures.map((capture) => (
                      <div key={capture.number}>
                        <code>${capture.number}</code>
                        <span>{capture.value ?? 'unmatched'}{capture.index === undefined ? '' : ` · index ${capture.index}–${capture.end}`}</span>
                      </div>
                    ))}
                  </div>
                )}

                {Object.keys(match.namedGroups).length > 0 && (
                  <div className="regex-group-list">
                    <span className="regex-group-title">Named groups</span>
                    {Object.entries(match.namedGroups).map(([name, value]) => (
                      <div key={name}><code>{name}</code><span>{value ?? 'unmatched'}</span></div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      <details className="tool-panel regex-testing-guide">
        <summary className="regex-guide-summary">
          <div>
            <h2>How to test every feature</h2>
            <p className="muted">Open the guide for one-click examples and validation checks.</p>
          </div>
          <span aria-hidden="true">›</span>
        </summary>

        <div className="regex-guide-content">
          <p className="muted">Choose an example to load it into the tester, then change the pattern, flags, text, or replacement and watch the results update.</p>
          <div className="regex-recipe-grid">
            {TEST_RECIPES.map((recipe) => (
              <button className="regex-recipe" type="button" key={recipe.title} onClick={() => tester.loadPreset(recipe)}>
                <span className="regex-recipe-heading">
                  <strong>{recipe.title}</strong>
                  <code>/{recipe.flags.join('')}</code>
                </span>
                <span>{recipe.description}</span>
              </button>
            ))}
          </div>

          <details className="regex-manual-tests">
            <summary>Additional validation checks</summary>
            <div>
              <p><strong>Invalid expression:</strong> enter <code>(</code> and confirm that a red syntax-error message appears.</p>
              <p><strong>No matches:</strong> use <code>\\d+</code> against <code>letters only</code> and confirm that “No matches found” appears.</p>
              <p><strong>Remove matches:</strong> enable replacement, leave the replacement box empty, and confirm that matched text is removed.</p>
              <p><strong>First match only:</strong> disable <code>g</code> and confirm that only the first occurrence is selected and replaced.</p>
              <p><strong>Zero-length match:</strong> use <code>^</code> with <code>gm</code> to verify that empty matches are handled without freezing.</p>
            </div>
          </details>
        </div>
      </details>
    </section>
  )
}
