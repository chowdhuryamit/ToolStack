import type { RestHeader } from '../types'

export function buildHeaders(headers: RestHeader[]) {
  return Object.fromEntries(headers.filter((header) => header.enabled).map((header) => [header.key, header.value]))
}
