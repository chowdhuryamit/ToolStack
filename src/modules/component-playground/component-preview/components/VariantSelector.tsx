type VariantSelectorProps = {
  variants: string[]
  value: string
  onChange: (variant: string) => void
}

export function VariantSelector({ variants, value, onChange }: VariantSelectorProps) {
  return (
    <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
      {variants.map((variant) => (
        <option key={variant}>{variant}</option>
      ))}
    </select>
  )
}
