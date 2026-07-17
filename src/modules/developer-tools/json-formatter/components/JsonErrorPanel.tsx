type JsonErrorPanelProps = {
  error?: string
}

export function JsonErrorPanel({ error }: JsonErrorPanelProps) {
  if (!error) return null

  return (
    <section className="empty-state" role="alert">
      <h2>Invalid JSON</h2>
      <p>{error}</p>
    </section>
  )
}
