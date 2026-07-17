import type { RestHeader } from '../types'

type HeaderEditorProps = {
  headers: RestHeader[]
}

export function HeaderEditor({ headers }: HeaderEditorProps) {
  return <pre>{JSON.stringify(headers, null, 2)}</pre>
}
