import { Link, useLocation } from 'react-router-dom'

export function Breadcrumbs() {
  const segments = useLocation().pathname.split('/').filter(Boolean)

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumbs">
      <Link to="/">Home</Link>
      {segments.map((segment, index) => {
        const to = `/${segments.slice(0, index + 1).join('/')}`
        return (
          <Link key={to} to={to}>
            {segment.replaceAll('-', ' ')}
          </Link>
        )
      })}
    </nav>
  )
}
