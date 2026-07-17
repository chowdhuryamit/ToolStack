import { NavLink } from 'react-router-dom'
import { Braces, Code2, GitBranch, GraduationCap, LayoutDashboard, Palette, PanelLeftClose, PanelLeftOpen, Sparkles, Wrench } from 'lucide-react'
import { APP_NAME } from '../../app/constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setSelectedCategory, toggleSidebar } from '../../store/slices/sidebarSlice'
import { Button } from '../ui/Button'

const links = [
  { to: '/dashboard', label: 'Dashboard', category: 'dashboard', icon: LayoutDashboard },
  { to: '/tools', label: 'Tools', category: 'tools', icon: Wrench },
  { to: '/css', label: 'CSS', category: 'css', icon: Palette },
  { to: '/api', label: 'API', category: 'api', icon: Braces },
  { to: '/git', label: 'Git', category: 'git', icon: GitBranch },
  { to: '/playground', label: 'Playground', category: 'playground', icon: Code2 },
  { to: '/learn', label: 'Learn', category: 'learn', icon: GraduationCap },
  { to: '/profile', label: 'Assistant', category: 'assistant', icon: Sparkles },
]

export function Sidebar() {
  const dispatch = useAppDispatch()
  const collapsed = useAppSelector((state) => state.sidebar.collapsed)

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <strong>{APP_NAME}</strong>
        <Button variant="ghost" aria-label="Toggle sidebar" onClick={() => dispatch(toggleSidebar())}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>
      <nav>
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink key={link.to} to={link.to} end={link.to === '/dashboard'} onClick={() => dispatch(setSelectedCategory(link.category))}>
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
