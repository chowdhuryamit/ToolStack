export const syncService = {
  async sync() {
    return { ok: true, syncedAt: new Date().toISOString() }
  },
}
