import { useEffect, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { store } from '../store/store'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setOnlineStatus } from '../store/slices/appSlice'
import { AuthProvider } from '../auth/AuthProvider'

type ProvidersProps = {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <OnlineStatusSync />
        <ThemeSync />
        {children}
      </AuthProvider>
    </Provider>
  )
}

function OnlineStatusSync() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const syncStatus = () => dispatch(setOnlineStatus(navigator.onLine))

    syncStatus()
    window.addEventListener('online', syncStatus)
    window.addEventListener('offline', syncStatus)

    return () => {
      window.removeEventListener('online', syncStatus)
      window.removeEventListener('offline', syncStatus)
    }
  }, [dispatch])

  return null
}

function ThemeSync() {
  const mode = useAppSelector((state) => state.theme.mode)

  useEffect(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolvedTheme = mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode
    document.documentElement.dataset.theme = resolvedTheme
  }, [mode])

  return null
}
