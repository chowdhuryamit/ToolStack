export const encryptionService = {
  async digest(value: string) {
    const data = new TextEncoder().encode(value)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
  },
}
