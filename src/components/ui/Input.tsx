import type { InputHTMLAttributes } from 'react'
import { cn } from '../../utilities/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return <input className={cn('input', className)} {...props} />
}
