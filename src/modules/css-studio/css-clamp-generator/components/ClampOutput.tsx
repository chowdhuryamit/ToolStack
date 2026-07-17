type ClampOutputProps = {
  value: string
}

export function ClampOutput({ value }: ClampOutputProps) {
  return <pre>{`font-size: ${value};`}</pre>
}
