import type { RestRequest } from '../types'

type RequestEditorProps = {
  request: RestRequest
  onChange: (request: RestRequest) => void
}

export function RequestEditor({ request, onChange }: RequestEditorProps) {
  return (
    <div className="toolbar">
      <select className="input" value={request.method} onChange={(event) => onChange({ ...request, method: event.target.value as RestRequest['method'] })}>
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
        <option>DELETE</option>
      </select>
      <input className="input" value={request.url} onChange={(event) => onChange({ ...request, url: event.target.value })} placeholder="https://api.example.com" />
    </div>
  )
}
