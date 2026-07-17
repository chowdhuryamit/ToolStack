import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import { Sidebar } from '../components/navigation/Sidebar'
import { CommandPalette } from '../components/navigation/CommandPalette'
import { Toast } from '../components/ui/Toast'
import { ChatAssistantPage } from '../modules/ai-assistant'
import { Button } from '../components/ui/Button'
import { X } from 'lucide-react'
import { useAppSelector } from '../store/hooks'

export function RootLayout() {
  const [assistantOpen, setAssistantOpen] = useState(false)
  const sidebarCollapsed = useAppSelector((state) => state.sidebar.collapsed)

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell-collapsed' : ''}`}>
      <Sidebar />
      <div className="app-main">
        <Header onAssistantOpen={() => setAssistantOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <aside className={`assistant-drawer ${assistantOpen ? 'assistant-drawer-open' : ''}`} aria-hidden={!assistantOpen}>
        <div className="assistant-drawer-header">
          <div>
            <p className="eyebrow">AI Code Assistant</p>
            <h2>Ask, refactor, explain</h2>
          </div>
          <Button variant="ghost" aria-label="Close assistant" onClick={() => setAssistantOpen(false)}>
            <X size={18} />
          </Button>
        </div>
        <ChatAssistantPage />
      </aside>
      <CommandPalette />
      <Toast />
    </div>
  )
}
