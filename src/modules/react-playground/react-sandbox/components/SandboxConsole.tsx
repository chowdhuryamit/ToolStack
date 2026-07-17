type SandboxConsoleProps = {
  logs: string[]
}

export function SandboxConsole({ logs }: SandboxConsoleProps) {
  return <pre>{logs.join('\n') || '// Console output'}</pre>
}
