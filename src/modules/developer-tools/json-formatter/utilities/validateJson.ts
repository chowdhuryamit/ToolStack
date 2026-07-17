import type { JsonValidationResult } from '../types'

export function validateJson(value: string): JsonValidationResult {
  try {
    JSON.parse(value)
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : 'Invalid JSON.' }
  }
}
