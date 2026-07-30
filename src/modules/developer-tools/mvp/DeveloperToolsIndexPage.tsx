import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Braces,
  Clock,
  CodeXml,
  Fingerprint,
  GitCompareArrows,
  Hash,
  KeyRound,
  Link2,
  Regex,
  ScrollText,
  Type,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { developerToolAccents } from '../toolAccents'
import { toolConfigs } from './configs'

const toolIcons: Record<string, LucideIcon> = {
  'json-formatter': Braces,
  'code-diff': GitCompareArrows,
  'json-diff': CodeXml,
  'regex-tester': Regex,
  'jwt-decoder': KeyRound,
  base64: ScrollText,
  'url-encoder': Link2,
  'uuid-generator': Fingerprint,
  'hash-generator': Hash,
  'timestamp-converter': Clock,
  'text-case-converter': Type,
}

const configuredCards = Object.entries(toolConfigs)
  .filter(([slug]) => slug !== 'json-validator' && slug !== 'json-minifier')
  .map(([slug, config]) => ({
    slug,
    title: slug === 'json-formatter' ? 'JSON Formatter, Validator & Minifier' : config.title,
    description: slug === 'json-formatter'
      ? 'Format, validate, and minify JSON in a colorful interactive editor.'
      : config.description,
  }))

const codeDiffCard = {
  slug: 'code-diff',
  title: 'Code Diff Checker',
  description: 'Compare source code in any Monaco-supported language with side-by-side or inline highlighting.',
}

const cards = configuredCards.flatMap((card) => (
  card.slug === 'json-formatter' ? [card, codeDiffCard] : [card]
))

export function DeveloperToolsIndexPage() {
  return (
    <section className="page-stack tool-workspace">
      <div className="section-heading">
        <p className="eyebrow">Local-first utilities</p>
        <h1>Developer Tools</h1>
        <p className="muted">Fast, focused tools for transforming and inspecting developer data in your browser.</p>
      </div>
      <div className="developer-tool-grid">
        {cards.map((card) => {
          const Icon = toolIcons[card.slug] ?? CodeXml
          const style = {
            '--tool-accent': developerToolAccents[card.slug] ?? '#4d90dd',
          } as CSSProperties

          return (
            <Link className="developer-tool-card" key={card.slug} style={style} to={`/tools/${card.slug}`}>
              <span className="developer-tool-icon"><Icon size={20} /></span>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <span>Open tool <ArrowRight size={15} /></span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
