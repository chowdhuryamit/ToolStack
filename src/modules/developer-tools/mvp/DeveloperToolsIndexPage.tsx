import { Link } from 'react-router-dom'
import { ArrowRight, Braces, CodeXml, Fingerprint, KeyRound, Link2, Regex, ScrollText, ShieldCheck, Type, Clock, Hash } from 'lucide-react'
import { toolConfigs } from './configs'

const icons = [Braces, ShieldCheck, CodeXml, ScrollText, Regex, KeyRound, Link2, Link2, Fingerprint, Hash, Clock, Type]

export function DeveloperToolsIndexPage() {
  return <section className="page-stack tool-workspace">
    <div className="section-heading"><p className="eyebrow">Local-first utilities</p><h1>Developer Tools</h1><p className="muted">Fast, focused tools for transforming and inspecting developer data in your browser.</p></div>
    <div className="developer-tool-grid">
      {Object.entries(toolConfigs).filter(([slug]) => slug !== 'json-validator' && slug !== 'json-minifier').map(([slug, config], index) => { const Icon = icons[index]; return <Link className="developer-tool-card" key={slug} to={`/tools/${slug}`}><span className="developer-tool-icon"><Icon size={20} /></span><h2>{slug === 'json-formatter' ? 'JSON Formatter, Validator & Minifier' : config.title}</h2><p>{slug === 'json-formatter' ? 'Format, validate, and minify JSON in a colorful interactive editor.' : config.description}</p><span>Open tool <ArrowRight size={15} /></span></Link> })}
    </div>
  </section>
}
