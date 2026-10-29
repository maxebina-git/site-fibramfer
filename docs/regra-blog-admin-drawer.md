# Regra Blog-Admin-Drawer

## Rotas confirmadas
- `/` → home (HomeScene)
- `/blog/` → drawer aberto, índice do blog (`BlogList`)
- `/blog/<slug>/` → drawer aberto com post revelado (`blog-post-<slug>`)
- `/admin/` → drawer aberto, login → tabela → modal de edição; URL permanece `/admin`

## Gatilhos
- Menu Blog → abre drawer (`/blog/`)
- Clicar no post → fecha cortina sobre lista, abre post (`/blog/<slug>/`)
- `Ctrl+Y` → abre `/admin/` (implementado em `NavigationDrawer.vue`)

## Admin
- Sem link no header (escondido)
- `AdminPanel.vue`: `localStorage` (`admin_posts`) em dev; `fetch('/api/admin.php')` em prod
- Login: `maxebina@gmail.com` / `4Bolot@828348`
- Edição 100% modal (`modalOpen`); URL não muda

## Barreiras já verificadas
- `getCollection('blog')` só vê `.md` (ex: `welcome.md`)
- Admin salva dinâmico, mas `FibramferDrawers.astro` não passa esses ids para `NavigationDrawer`
- `NavigationDrawer.vue` monta `routes.value` com `revealKey: 'blog-post-<id>'`; se o id não está no array, `handleRevealContent` retorna sem abrir cortina
- `BlogPostDrawer` só renderiza posts que vieram do `getCollection`
- `BlogList.astro` injeta links via script, mas seletor `data-admin-loaded` / `.blog-grid-loaded` está desconectado

## Solução combinada (C + integração)
1. Corrigir `BlogList.astro`
2. Componente dinâmico que leia `admin_posts` (dev) / API (prod)
3. Injetar posts do admin no array `routes` / DOM (`data-blog-post-id`) para que cortinas funcionem

## Barreiras futuras simuladas
- API PHP pode retornar campos diferentes do `localStorage`
- Drawer aberto + novo post criado → precisa sincronizar sem reload
- Edição de post aberto (`/blog/slug/`) precisa refletir no drawer sem fechar
- Build estático pode perder conteúdo dinâmico se não for client-renderizado
- Múltiplos posts dinâmicos → `routes.value` precisa ser variável
- Decisão: `welcome` estatico (referência); posts admin dinâmicos via componente cliente (`DynamicBlogPost.vue`) + `BlogList`; adapter SSR tentado mas não compatível com esta versão Astro — manter estático
- Auto-slug implementado: campo `Slug (URL)` na modal; `id = slugify(title)` sem timestamp
- Removido subtítulo do logo (`FibramferLogo.astro`) conforme pedido do usuário
- NOTA: em `/blog/` com drawer aberto, frase do hero (`Soluções...`) pode sumir no F5 até `syncHeroTitlePosition()` ser executado; ajuste recomendado no `Header.astro` quando `normalizedPath === '/blog/'`
- ALERTAS ANTES DE EXECUTAR: (a) verificar `localStorage` populado; (b) `NavigationDrawer` precisa reconhecer ids dinâmicos; (c) F5 com drawer aberta pode quebrar sincronização de `currentPath`
- Logo/Home: ao clicar com drawer aberto, `Header.astro` sincroniza posição (`syncLogoPosition`) mas pode não fechar drawer; comportamento esperado = igual itens do menu (fechar drawer, ir `/`)
- Tooltip/logo frase: ao renovar `/blog/`, frase abaixo do logo some (`panelOpen` + CSS do Header); ajuste = forçar visibilidade do subtítulo independentemente do drawer
