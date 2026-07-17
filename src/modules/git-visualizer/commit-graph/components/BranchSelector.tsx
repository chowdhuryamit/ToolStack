type BranchSelectorProps = {
  branches: string[]
  value: string
  onChange: (branch: string) => void
}

export function BranchSelector({ branches, value, onChange }: BranchSelectorProps) {
  return (
    <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
      {branches.map((branch) => (
        <option key={branch}>{branch}</option>
      ))}
    </select>
  )
}
