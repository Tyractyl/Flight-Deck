export function formatMemory(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1).replace(/\.0$/, '')} GiB`
  }
  return `${mb} MiB`
}
