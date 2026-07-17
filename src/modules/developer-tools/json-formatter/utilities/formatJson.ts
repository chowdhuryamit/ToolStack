export function formatJson(value: string) {
  return JSON.stringify(JSON.parse(value), null, 2)
}
