import { DEFAULT_PROMPTS } from '../constants'

type PromptLibraryProps = {
  onPick: (prompt: string) => void
}

export function PromptLibrary({ onPick }: PromptLibraryProps) {
  return (
    <div className="tool-grid">
      {DEFAULT_PROMPTS.map((prompt) => (
        <button className="button button-secondary" type="button" key={prompt} onClick={() => onPick(prompt)}>
          {prompt}
        </button>
      ))}
    </div>
  )
}
