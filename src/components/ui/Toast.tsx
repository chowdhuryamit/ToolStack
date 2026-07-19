import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { CheckCircle2, CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { removeNotification, type AppNotification } from '../../store/slices/notificationSlice'

const icons = { success: CheckCircle2, error: CircleAlert, warning: TriangleAlert, info: Info }

function ToastItem({ item }: { item: AppNotification }) {
  const dispatch = useAppDispatch()
  const Icon = icons[item.kind]

  useEffect(() => {
    const timeout = window.setTimeout(() => dispatch(removeNotification(item.id)), 2800)
    return () => window.clearTimeout(timeout)
  }, [dispatch, item.id])

  return <div className={`toast toast-${item.kind}`}><Icon size={17} /><span>{item.message}</span></div>
}

export function Toast({ accent }: { accent?: string }) {
  const notifications = useAppSelector((state) => state.notifications.items)

  return (
    <div className="toast-region route-accent" style={{ '--page-accent': accent } as CSSProperties} aria-live="polite">
      {notifications.map((item) => <ToastItem item={item} key={item.id} />)}
    </div>
  )
}
