import { useState } from 'react'
import { clipboardService } from '../services/clipboardService'

export function useClipboard() {
  const [copied, setCopied] = useState(false)

  async function copy(value: string) {
    await clipboardService.copy(value)
    setCopied(true)
  }

  return { copied, copy }
}
