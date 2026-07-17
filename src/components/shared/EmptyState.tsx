type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <svg viewBox="0 0 180 120" role="presentation" aria-hidden="true">
        <rect x="24" y="24" width="132" height="72" rx="16" />
        <path d="M48 52h42M48 70h68M118 50l14 10-14 10" />
      </svg>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  )
}
