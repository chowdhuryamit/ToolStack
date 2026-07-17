export function extractImports(code: string) {
  return code.split('\n').filter((line) => line.trim().startsWith('import '))
}
