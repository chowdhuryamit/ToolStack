export function serializeProps(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2)
}
