export function formatError(error: unknown) {
  if (error instanceof Error) return error.message
  return 'An unknown error occurred.'
}
