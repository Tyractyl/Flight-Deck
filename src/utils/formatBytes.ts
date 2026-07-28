export function formatBytes(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`
  }
  return `${mb} MB`
}

export function formatPercent(percent: number): string {
  return `${percent}%`
}
