import { stripSiteBase } from './sitePath'

export const PANEL_ROUTES = [
  '/a-fibramfer',
  '/admin',
  '/cadeira-suspensa',
  '/seguranca',
  '/blog',
  '/contato',
  '/privacidade',
  '/termos',
] as const

export const LEGAL_ROUTES = ['/privacidade', '/termos'] as const

export function normalizeDrawerPath(path: string): string {
  const value = stripSiteBase(path || '/')
  return value === '/' ? value : value.replace(/\/+$/, '')
}

export function isDrawerPanelPath(path: string): boolean {
  const normalized = normalizeDrawerPath(path)
  if ((PANEL_ROUTES as readonly string[]).includes(normalized)) return true
  return normalized.startsWith('/blog/') && normalized !== '/blog'
}

export function isLegalDrawerPath(path: string): boolean {
  return (LEGAL_ROUTES as readonly string[]).includes(normalizeDrawerPath(path))
}
