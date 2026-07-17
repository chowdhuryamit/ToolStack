export function parsePropsJson(value: string) {
  return JSON.parse(value) as Record<string, unknown>
}
