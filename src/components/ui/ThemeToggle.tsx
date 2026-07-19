import { Moon, Sun } from 'lucide-react'
import { cn } from '../../utilities/cn'

type ThemeToggleProps = {
  isLight: boolean
  onChange: (isLight: boolean) => void
  className?: string
  label?: string
}

export function ThemeToggle({ isLight, onChange, className, label = 'Editor theme' }: ThemeToggleProps) {
  const mode = isLight ? 'Light' : 'Dark'

  return (
    <div className={cn('inline-flex shrink-0 items-center gap-2', className)}>
      <span className="text-xs font-medium text-[var(--muted)]" aria-hidden="true">{mode}</span>
      <button
        className="relative h-7 w-13 shrink-0 cursor-pointer rounded-full border border-[var(--border)] bg-[var(--bg-soft)] p-[3px] shadow-inner transition-colors hover:border-[var(--page-accent,var(--primary))] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_srgb,var(--page-accent,var(--primary))_24%,transparent)]"
        type="button"
        role="switch"
        aria-checked={isLight}
        aria-label={`${label}: ${mode}. Switch to ${isLight ? 'dark' : 'light'} mode`}
        title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
        onClick={() => onChange(!isLight)}
      >
        <span
          className={cn(
            'absolute top-[3px] flex size-5 items-center justify-center rounded-full bg-[var(--page-accent,var(--primary))] text-[#081116] shadow-[0_0_10px_color-mix(in_srgb,var(--page-accent,var(--primary))_42%,transparent)] transition-transform duration-200',
            isLight ? 'translate-x-6' : 'translate-x-0',
          )}
        >
          {isLight ? <Sun size={12} aria-hidden="true" /> : <Moon size={12} aria-hidden="true" />}
        </span>
      </button>
    </div>
  )
}
