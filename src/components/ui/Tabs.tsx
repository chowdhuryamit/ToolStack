import type { ReactNode } from 'react'
import { Button } from './Button'

export type TabItem = {
  id: string
  label: string
  content: ReactNode
}

type TabsProps = {
  items: TabItem[]
  activeId: string
  onChange: (id: string) => void
}

export function Tabs({ items, activeId, onChange }: TabsProps) {
  const activeItem = items.find((item) => item.id === activeId) ?? items[0]

  return (
    <div className="tabs">
      <div className="tab-list" role="tablist">
        {items.map((item) => (
          <Button key={item.id} variant={item.id === activeId ? 'primary' : 'secondary'} onClick={() => onChange(item.id)}>
            {item.label}
          </Button>
        ))}
      </div>
      <div className="tab-panel">{activeItem?.content}</div>
    </div>
  )
}
