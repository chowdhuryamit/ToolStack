import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'

type ToolCardProps = {
  title: string
  href: string
  description?: string
  meta?: string
  category: string
  featured?: boolean
}

function ToolPreview({ category }: { category: string }) {
  if (category === 'css-studio') {
    return <span className="preview-gradient" aria-hidden="true" />
  }

  if (category === 'git-visualizer') {
    return (
      <svg className="preview-git" viewBox="0 0 72 42" aria-hidden="true">
        <path d="M12 9c12 0 10 24 24 24h23M12 9h47" />
        <circle cx="12" cy="9" r="4" />
        <circle cx="59" cy="9" r="4" />
        <circle cx="59" cy="33" r="4" />
      </svg>
    )
  }

  if (category === 'developer-tools' || category === 'react-playground') {
    return (
      <span className="preview-code" aria-hidden="true">
        <i>&lt;div&gt;</i><i> const ready = true</i><i>&lt;/div&gt;</i>
      </span>
    )
  }

  if (category === 'api-playground') {
    return <span className="preview-api" aria-hidden="true"><i>GET</i><b>200</b></span>
  }

  return <span className={`preview-orbit preview-orbit-${category}`} aria-hidden="true"><i /><i /><i /></span>
}

export function ToolCard({ title, href, category, featured = false, description = 'Open workspace', meta = 'Ready' }: ToolCardProps) {
  return (
    <Card className={`tool-card tool-card-${category} ${featured ? 'tool-card-featured' : ''}`}>
      <div className="tool-card-copy">
        <span className="card-meta">{meta}</span>
        <h2>{title}</h2>
        <p>{description}</p>
        <Link className="tool-card-link" to={href}>
          Open tool <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="tool-preview"><ToolPreview category={category} /></div>
    </Card>
  )
}
