import type { ReactNode } from 'react'
import { Button } from './Button'

type ModalProps = {
  isOpen: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ isOpen, title, children, onClose }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </header>
        {children}
      </section>
    </div>
  )
}
