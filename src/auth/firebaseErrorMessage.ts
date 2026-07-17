const messages: Record<string, string> = {
  'auth/email-already-in-use': 'An account already exists for this email.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'The browser blocked the Google sign-in popup.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/weak-password': 'Use a password with at least 6 characters.',
}

export function firebaseErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error) {
    const code = String(error.code)
    return messages[code] ?? 'Authentication failed. Please try again.'
  }
  return 'Authentication failed. Please try again.'
}
