import type { ReactNode } from 'react'

type ToolPageProps = {
  title: string
  description: string
  children: ReactNode
}

export function ToolPage({ title, description, children }: ToolPageProps) {
  return (
    <section className="page-stack">
      <div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {children}
    </section>
  )
}
