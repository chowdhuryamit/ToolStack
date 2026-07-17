export function parseCssLength(value: string) {
  return Number.parseFloat(value.replace(/[^\d.-]/g, ''))
}
