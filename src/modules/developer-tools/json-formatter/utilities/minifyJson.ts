export function minifyJson(value: string) {
  return JSON.stringify(JSON.parse(value))
}
