export const clipboardService = {
  async copy(value: string) {
    await navigator.clipboard.writeText(value)
  },
}
