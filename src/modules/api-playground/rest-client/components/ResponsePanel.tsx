import type { RestResponse } from '../types'

type ResponsePanelProps = {
  response?: RestResponse
}

export function ResponsePanel({ response }: ResponsePanelProps) {
  return <pre>{response ? response.body : '// Response appears here.'}</pre>
}
