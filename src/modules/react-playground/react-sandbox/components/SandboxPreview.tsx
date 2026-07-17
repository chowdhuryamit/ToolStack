type SandboxPreviewProps = {
  preview: string
}

export function SandboxPreview({ preview }: SandboxPreviewProps) {
  return <pre>{preview}</pre>
}
