import { useEffect } from 'react'
import { LogIn, LogOut, Moon, Search, Sparkles, Sun, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useAuth } from '../../auth/authContext'
import { logOut } from '../../firebase/auth'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setCommandPaletteOpen } from '../../store/slices/commandPaletteSlice'
import { Breadcrumbs } from './Breadcrumbs'
import { setEditorTheme, setThemeMode } from '../../store/slices/themeSlice'

type HeaderProps = {
  onAssistantOpen: () => void
}

export function Header({ onAssistantOpen }: HeaderProps) {
  const dispatch = useAppDispatch()
  const themeMode = useAppSelector((state) => state.theme.mode)
  const { user, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()

  function toggleTheme() {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark'
    dispatch(setThemeMode(nextMode))
    dispatch(setEditorTheme(nextMode === 'dark' ? 'vs-dark' : 'vs-light'))
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        dispatch(setCommandPaletteOpen(true))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])

  return (
    <header className="header">
      <Breadcrumbs />
      <div className="header-actions">
        <button className="command-search" type="button" onClick={() => dispatch(setCommandPaletteOpen(true))}>
          <Search size={16} />
          <span>Search tools, snippets, routes</span>
          <kbd>Ctrl K</kbd>
        </button>
        <Button variant="secondary" onClick={toggleTheme} aria-label="Toggle theme">
          {themeMode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        </Button>
        <Button variant="secondary" onClick={onAssistantOpen}>
          <Sparkles size={16} />
          AI
        </Button>
        {!isAuthLoading && (user ? (
          <>
            <span className="status-pill account-pill" title={user.email ?? 'Your account'}>
              <UserCircle size={16} />
              {user.displayName?.split(' ')[0] || 'Account'}
            </span>
            <Button variant="ghost" aria-label="Sign out" title="Sign out" onClick={() => void logOut()}><LogOut size={16} /></Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => navigate('/login')}><LogIn size={16} />Sign in</Button>
        ))}
      </div>
    </header>
  )
}
