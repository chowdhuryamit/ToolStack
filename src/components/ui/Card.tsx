import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utilities/cn'

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <article className={cn('card', className)} {...props}>
      {children}
    </article>
  )
}
