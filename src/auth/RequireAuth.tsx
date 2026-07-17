import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './authContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <section className="empty-state"><p>Checking your session…</p></section>

  if (!user) {
    return <Navigate to="/login" replace state={{ returnTo: `${location.pathname}${location.search}` }} />
  }

  return children
}
