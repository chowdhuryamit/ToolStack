import { Download } from 'lucide-react'
import { Button } from '../ui/Button'
import { downloadTextFile } from '../../services/downloadService'

type DownloadButtonProps = {
  filename: string
  content: string
}

export function DownloadButton({ filename, content }: DownloadButtonProps) {
  return (
    <Button variant="secondary" onClick={() => downloadTextFile(filename, content)} aria-label="Download">
      <Download size={16} />
    </Button>
  )
}
