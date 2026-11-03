const normalizedBase = import.meta.env.BASE_URL.replace(/\/+$/, '')

export const SITE_BASE = `${normalizedBase}/`
export const SITE_ORIGIN = 'https://fibramfer.com.br'

export function sitePath(path: string): string {
  const value = String(path || '')
  if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return value

  const normalizedPath = value.replace(/^\/+/, '')
  if (value === SITE_BASE.slice(0, -1) || value.startsWith(SITE_BASE)) return value
  return `${SITE_BASE}${normalizedPath}`
}

export function stripSiteBase(path: string): string {
  const value = path || '/'
  if (normalizedBase && (value === normalizedBase || value.startsWith(`${normalizedBase}/`))) {
    return value.slice(normalizedBase.length) || '/'
  }
  return value
}
