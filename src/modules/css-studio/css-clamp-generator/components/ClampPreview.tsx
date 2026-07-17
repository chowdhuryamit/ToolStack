type ClampPreviewProps = {
  clampValue: string
}

export function ClampPreview({ clampValue }: ClampPreviewProps) {
  return <p style={{ fontSize: clampValue }}>Preview text using {clampValue}</p>
}
