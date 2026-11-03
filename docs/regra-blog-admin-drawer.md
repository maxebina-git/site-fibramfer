# Regra Blog-Admin-Drawer

## Contrato de rotas

A URL é a fonte da verdade. Todas as rotas abaixo renderizam `HomeScene home` e
abrem o drawer correspondente no SSR e após F5:

- `/a-fibramfer/`
- `/cadeira-suspensa/`
- `/seguranca/`
- `/blog/`
- `/contato/`
- `/privacidade/`
- `/termos/`
- `/admin/`
- `/blog/<slug>/`
- `/blog/?post=<id>`

## Comportamento esperado

- O hero e o restante da `HomeScene` permanecem atrás do drawer em qualquer rota.
- O H1 do hero continua visível na faixa esquerda, com a geometria definida pelo
  Header.
- F5 (ou acesso direto) abre o drawer já no conteúdo correto, sem repetir a
  cortina de entrada.
- Navegação client-side entre drawers mantém o mesmo painel montado e troca
  apenas o slot de conteúdo; a cortina é repetida apenas quando o conteúdo muda.
- O logo/Home fecha o drawer e retorna para `/` sem deixar a home quebrada.
- Clicar em um card do blog (link `/blog/<slug>/`) é navegação client-side:
  o drawer não desmonta e a cortina fecha sobre a lista e reabre no post,
  como nas outras trocas de rota. Clicar no mesmo post não faz nada.
  O SSR de `/blog/<slug>/` já garante conteúdo e metadados no HTML (SEO).
- Back/Forward, resize e troca entre painéis preservam o mesmo contrato.
- Enquanto o drawer está aberto, somente o backdrop da home (`[data-home-backdrop]`)
  recebe `inert` e `aria-hidden`; nunca o `<main>` que contém o drawer.

## Implementação

- `src/lib/drawerRoutes.ts`: normaliza a base `/site-novo/` e centraliza a
  detecção das rotas de painel e legais.
- `BaseLayout.astro`: usa esse helper para publicar
  `data-panel-drawer-open`, `data-legal-drawer`,
  `data-fibramfer-initializing` e `data-fibramfer-direct-drawer` no SSR.
- `Header.astro`: usa o mesmo helper no SSR e no cliente, incluindo `/admin/` e
  `/blog/<slug>/`.
- `FibramferDrawers.astro`: calcula `initialPath` e `initialPostId`, inclusive
  para `/blog/?post=<id>`, e passa ambos ao `NavigationDrawer`.
- `src/lib/blogBuild.ts`: fonte única de posts para o build. Em dev usa a
  coleção `blog` local; em prod busca `BLOG_API_URL` (default
  `https://fibramfer.com.br/site-novo/api/admin.php?action=list`) e cai para a
  coleção local com aviso se a API estiver indisponível.
- `pages/blog/[slug].astro`: SSG em dev e prod — cada post vira
  `/blog/<slug>/` com título/description/`og:`/canonical próprios
  (`type="article"`). Posts em prod vêm via `getStaticPaths` na build, então
  publicar exigir build+deploy.
- `BlogList.astro`: grade estática de cards no SSR (link `/blog/<slug>/`).
- `BlogPostStatic.astro`: espelho estático do `BlogPostDrawer` para o HTML do
  post em prod. Dev continua com `Content` da coleção.
- `NavigationDrawer.vue`: inicializa o post direto, usa um `revealKey` sentinela
  para não repetir a cortina no primeiro paint e aplica `inert` no backdrop.
- `HomeScene.astro`: marca o backdrop com `data-home-backdrop`.

## Admin

- Sem link no header; abre por `Ctrl+Y` em `/admin/`.
- Em desenvolvimento usa `localStorage`; em produção usa a API PHP.
- A edição permanece em modal e não altera a URL.
- Imagem anexada no admin: `admin.php?action=save` converte a data URL base64 em
  arquivo em `uploads/` (hash SHA-1 do conteúdo, igual ao fluxo de dev) e grava
  apenas o caminho `/uploads/<hash>.<ext>` na coluna `image`. Em falha de
  escrita, mantém a string original. Data URLs antigas na tabela não são
  migradas — re-anexe a imagem para persistir como arquivo.
- Posts criados/editados precisam entrar em `routes` e no DOM (`data-blog-post-id`)
  para que a cortina encontre o conteúdo.

## Checklist de validação

1. `npx astro check` sem erros.
2. `npm run build` — 9 páginas fixas + 1 página SSG por post (em dev, a partir dos `.md`; em prod, a partir da API).
3. Em dev, abrir cada rota, atualizar com F5 e confirmar hero + drawer.
4. Abrir o Blog pelo menu (client-side) e confirmar que a grade de cards aparece sem F5.
5. Abrir `/blog/<slug>/` e conferir no view-source o `<title>`, `<meta name="description">`, `og:image`/`og:` e o conteúdo do post no HTML (SSG).
6. Abrir `/blog/?post=<id>` direto e confirmar que a lista não pisca antes do post.
6. Trocar entre post e lista, fechar pelo logo e voltar para `/`.
7. Repetir com movimento reduzido, resize e back/forward.
