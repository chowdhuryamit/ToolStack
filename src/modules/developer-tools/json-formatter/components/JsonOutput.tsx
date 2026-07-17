type JsonOutputProps = {
  value: string
}

export function JsonOutput({ value }: JsonOutputProps) {
  return <pre>{value || '// Formatted JSON appears here.'}</pre>
}
