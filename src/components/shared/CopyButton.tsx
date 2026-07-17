import { Copy } from 'lucide-react'
import { Button } from '../ui/Button'
import { clipboardService } from '../../services/clipboardService'

type CopyButtonProps = {
  value: string
}

export function CopyButton({ value }: CopyButtonProps) {
  return (
    <Button variant="secondary" onClick={() => void clipboardService.copy(value)} aria-label="Copy">
      <Copy size={16} />
    </Button>
  )
}
