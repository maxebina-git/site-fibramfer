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
- `/blog/<slug>/` (só em dev — em prod `post.php`)
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
- Clicar em um card do blog (`/blog/?post=<id>`) é navegação client-side:
  o drawer não desmonta e a cortina fecha sobre a lista e reabre no post,
  como nas outras trocas de rota. Clicar no mesmo post não faz nada.
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
  para `/blog/?post=<id>`, e passa ambos ao `NavigationDrawer`. Em prod passa
  `posts=[]` ao `BlogList` (a grade é buscada no cliente); em dev passa a
  coleção `.md` local.
- `BlogList.astro`: grade dinámica via island `BlogListGrid.vue` (`client:load`).
- `BlogListGrid.vue`: em dev renderiza os posts `.md` recebidos por props
  (`import.meta.env.DEV`); em prod busca `admin.php?action=list` no `onMounted`,
  sempre fresco (sem sessionStorage). Cards linkam `/blog/?post=<id>`,
  interceptados no cliente.
- `NavigationDrawer.vue`: inicializa o post direto, usa um `revealKey` sentinela
  para não repetir a cortina no primeiro paint e aplica `inert` no backdrop.
- `public/.htaccess` + `public/post.php`: rota universal para `/blog/<slug>/` em
  prod — o PHP renderiza qualquer slug a partir do banco (busca direta em
  `admin.php`/DB, com title, description, `og:` completos). Publicado junto
  com a dist via FTP. Paths inexistentes → 404 amigável.
- `HomeScene.astro`: marca o backdrop com `data-home-backdrop`.
- Dev: `src/content/blog/*.md` renderizam rotas Astro normalmente
  (`blog/[slug].astro` SSG via getStaticPaths, só em dev).

## Admin

- Sem link no header; abre por `Ctrl+Y` em `/admin/`.
- Em desenvolvimento usa `localStorage`; em produção usa a API PHP.
- A edição permanece em modal e não altera a URL.
- Imagem anexada no admin: redimensionada no navegador antes de salvar (lado
  maior ≤1600px, JPEG qualidade 0.85; PNG/WebP pequenos ficam intactos), pois o
  servidor responde 413 para corpos de requisição acima do limite. Compressão
  local evita o erro independentemente do tamanho original da foto.
- Imagem anexada no admin: `admin.php?action=save` converte a data URL base64 em
  arquivo em `uploads/` (hash SHA-1 do conteúdo) e grava apenas o caminho
  `/uploads/<hash>.<ext>` na coluna `image`. Em falha de escrita, mantem a
  string original. Data URLs antigas na tabela não são migradas.
- Posts criados/editados precisam entrar em `routes` e no DOM (`data-blog-post-id`)
  para que a cortina encontre o conteúdo.

## Checklist de validação

1. `npx astro check` sem erros.
2. `npm run build` — 9 páginas fixas (+ 3 SSG dos `.md` em dev).
3. Em dev, abrir cada rota, atualizar com F5 e confirmar hero + drawer.
4. Abrir o Blog pelo menu e confirmar a grade de posts sem F5.
5. Abrir `/blog/?post=<id>` e clicar num card — cortina fecha/reabre, conteúdo
   do post aparece dentro da drawer.
6. Abrir `/blog/<slug>/` direto — em dev o SSR do Astro exibe o post; em prod
   o `post.php` serve o post com meta próprio.
7. Trocar entre artigo e grid, fechar pelo logo e voltar para `/`.
8. Repetir com movimento reduzido, resize e back/forward.
