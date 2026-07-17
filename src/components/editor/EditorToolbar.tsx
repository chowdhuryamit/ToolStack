import { Play, Save } from 'lucide-react'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Tooltip } from '../ui/Tooltip'

type EditorToolbarProps = {
  language: string
  onLanguageChange: (language: string) => void
}

export function EditorToolbar({ language, onLanguageChange }: EditorToolbarProps) {
  return (
    <div className="toolbar">
      <Select value={language} onChange={(event) => onLanguageChange(event.target.value)} aria-label="Language">
        <option value="typescript">TypeScript</option>
        <option value="javascript">JavaScript</option>
        <option value="json">JSON</option>
        <option value="css">CSS</option>
      </Select>
      <Tooltip label="Run">
        <Button aria-label="Run">
          <Play size={16} />
        </Button>
      </Tooltip>
      <Tooltip label="Save">
        <Button variant="secondary" aria-label="Save">
          <Save size={16} />
        </Button>
      </Tooltip>
    </div>
  )
}
