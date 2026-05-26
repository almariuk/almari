export function cdnUrl(url: string | null | undefined, width: number, quality: number): string | null {
  if (!url) return null
  const rendered = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  const sep = rendered.includes('?') ? '&' : '?'
  return `${rendered}${sep}width=${width}&quality=${quality}`
}
