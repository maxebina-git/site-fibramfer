import { getCollection } from 'astro:content'

export interface BlogPostBuild {
  id: string
  title: string
  date: string
  category?: string
  image?: string
  description?: string
  /** HTML do post. Vazio no dev (conteúdo renderizado pelo Astro Content). */
  contentHtml: string
  /** Entry da coleção local (dev / fallback). */
  devPost?: any
}

let cached: Promise<BlogPostBuild[]> | null = null

export function getBlogPostsForBuild(): Promise<BlogPostBuild[]> {
  if (!cached) cached = build()
  return cached
}

async function build(): Promise<BlogPostBuild[]> {
  const local = await loadLocal()
  if (!import.meta.env.PROD) return local

  const fetched = await fetchProd()
  if (fetched === null) {
    console.warn('[blog] API de produção indisponível no build; usando posts .md locais.')
    return local
  }
  return fetched
}

async function loadLocal(): Promise<BlogPostBuild[]> {
  const collection = await getCollection('blog')
  return collection
    .map((post) => ({
      id: post.id,
      title: post.data.title,
      date: new Date(post.data.date).toISOString(),
      category: post.data.category,
      image: post.data.image,
      description: post.data.description,
      contentHtml: '',
      devPost: post,
    }))
    .sort(byDateDesc)
}

async function fetchProd(): Promise<BlogPostBuild[] | null> {
  // O certificado SSL de produção não é confiável por cadeia (AIA) e quebra
  // em Node/PowerShell; o endpoint é público (posts do blog), então usa HTTP
  // por padrão. HTTPS continua disponível via BLOG_API_URL.
  const url =
    import.meta.env.BLOG_API_URL ||
    'http://fibramfer.com.br/site-novo/api/admin.php?action=list'
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const data = await res.json()
    const rows: unknown[] = Array.isArray((data as { posts?: unknown[] })?.posts)
      ? ((data as { posts: unknown[] }).posts)
      : []
    const normalized: BlogPostBuild[] = []
    for (const row of rows) {
      const r = row as Record<string, unknown>
      if (!r || typeof r.id !== 'string' || !r.id) continue
      normalized.push({
        id: r.id,
        title: typeof r.title === 'string' ? r.title : '',
        date: typeof r.date === 'string' ? new Date(r.date).toISOString() : new Date().toISOString(),
        category: typeof r.category === 'string' ? r.category : undefined,
        image: typeof r.image === 'string' ? r.image : undefined,
        description: typeof r.description === 'string' ? r.description : undefined,
        contentHtml: typeof r.content === 'string' ? r.content : '',
      })
    }
    return normalized.sort(byDateDesc)
  } catch {
    return null
  }
}

function byDateDesc(a: BlogPostBuild, b: BlogPostBuild): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime()
}
