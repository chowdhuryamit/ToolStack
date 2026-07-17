import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../utilities/cn'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select className={cn('input', className)} {...props}>
      {children}
    </select>
  )
}
