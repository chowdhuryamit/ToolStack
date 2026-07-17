import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utilities/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

export function Button({ className, variant = 'primary', children, ...props }: ButtonProps) {
  return (
    <button className={cn('button', `button-${variant}`, className)} type="button" {...props}>
      {children}
    </button>
  )
}
