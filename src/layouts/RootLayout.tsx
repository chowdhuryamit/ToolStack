import { useState, type CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import { Sidebar } from '../components/navigation/Sidebar'
import { CommandPalette } from '../components/navigation/CommandPalette'
import { Toast } from '../components/ui/Toast'
import { ChatAssistantPage } from '../modules/ai-assistant'
import { Button } from '../components/ui/Button'
import { X } from 'lucide-react'
import { useAppSelector } from '../store/hooks'

const developerToolAccents: Record<string, string> = {
  'json-formatter': '#4d90dd',
  'saved-data': '#4d90dd',
  'json-diff': '#4cb65b',
  'regex-tester': '#ba8f3e',
  'jwt-decoder': '#a17bdd',
  base64: '#4cb7c1',
  'url-encoder': '#cd7073',
  'uuid-generator': '#4d90dd',
  'hash-generator': '#4cb65b',
  'timestamp-converter': '#ba8f3e',
  'text-case-converter': '#a17bdd',
}

function getRouteAccent(pathname: string) {
  if (pathname.startsWith('/tools/json-diff')) return developerToolAccents['json-diff']
  if (pathname.startsWith('/tools/')) {
    const slug = pathname.split('/').filter(Boolean).at(-1) ?? ''
    return developerToolAccents[slug] ?? '#4d90dd'
  }
  if (pathname.startsWith('/tools') || pathname.startsWith('/saved')) return '#4d90dd'
  if (pathname.startsWith('/css')) return '#ba8f3e'
  if (pathname.startsWith('/api')) return '#4cb7c1'
  if (pathname.startsWith('/git')) return '#4cb65b'
  if (pathname.startsWith('/playground/components')) return '#cd7073'
  if (pathname.startsWith('/playground')) return '#a17bdd'
  if (pathname.startsWith('/learn')) return '#ba8f3e'
  if (pathname.startsWith('/profile')) return '#a17bdd'
  return '#4cb7c1'
}

export function RootLayout() {
  const [assistantOpen, setAssistantOpen] = useState(false)
  const sidebarCollapsed = useAppSelector((state) => state.sidebar.collapsed)
  const { pathname } = useLocation()
  const routeAccentStyle = { '--page-accent': getRouteAccent(pathname) } as CSSProperties

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell-collapsed' : ''}`}>
      <Sidebar />
      <div className="app-main route-accent" style={routeAccentStyle}>
        <Header onAssistantOpen={() => setAssistantOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <aside className={`assistant-drawer route-accent ${assistantOpen ? 'assistant-drawer-open' : ''}`} style={{ '--page-accent': '#a17bdd' } as CSSProperties} aria-hidden={!assistantOpen}>
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
      <Toast accent={getRouteAccent(pathname)} />
    </div>
  )
}
