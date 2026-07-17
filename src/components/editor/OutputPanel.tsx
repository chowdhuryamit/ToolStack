import { Card } from '../ui/Card'

export function OutputPanel() {
  return (
    <Card className="output-panel">
      <h2>Output</h2>
      <pre>{'// Results will appear here.'}</pre>
    </Card>
  )
}
