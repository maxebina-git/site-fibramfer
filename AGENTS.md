# AGENTS.md

> Instruções para agentes de IA (OpenCode) trabalharem neste repositório.

## Antes de agir

- O Design System `ds-grupo-rkb` (../ds-grupo-rkb) é a **única fonte da verdade** de marca,
  tokens e componentes.
- `public/style-guide/` **NÃO é referência** (nem ler para seguir, nem alterar) — é legado.

## Onde nasce cada ajuste (DS-first)

| Tipo de ajuste | Onde fazer | Depois |
|---|---|---|
| Tokens/tema (cores, raio, fontes, spacing) | `../ds-grupo-rkb/src/tokens/*` | `npm run build:lib` no DS |
| Componentes (Button/Header/Footer, variantes, comportamento de componente) | `../ds-grupo-rkb/src/components/*` | `npm run build:lib` no DS |
| Página/Astro (scrollspy, ids de section, snap, blog, layout, copy) | aqui | consome tokens do DS, **nunca duplica estilo** |

- Nunca copiar (CTRL+C/CTRL+C) componente/estilo do DS para cá.
- O que fica no site: layout de página, copy, ativos da marca e comportamento one-page.

## Loop de validação

1. Se mexeu no DS: `npm run build:lib` em `../ds-grupo-rkb`.
2. Aqui: `npx astro check` (0 erros) → `npm run build` (9 páginas) → preview.

- A dependência é `file:../ds-grupo-rkb` (junction): o `dist/` é lido direto, sem reinstall.

## Comandos

- dev: `npm run dev` (porta 4334)
- build: `npm run build` (Astro, estático, saída em `dist/`)
- check: `npx astro check`
- preview: `npx astro preview`

## Sincronias manuais (dívidas conhecidas)

- **Espelho `@theme`** em `src/css/global.css` replica
  `ds-grupo-rkb/src/tokens/semantic.css`. Mudou o `semantic.css` → replicar aqui
  (mesmos nomes/valores `var()`; **sem** `--font-mono`, para evitar circular).
  Em runtime, `body[data-theme="fibramfer"]` (Black & Gold) sobrescreve os valores.
- **Tipos do DS**: o `dist/index.d.ts` do DS é quebrado (re-exporta `.vue` inexistente) →
  contornado pelo shim `src/types/ds-grupo-rkb.d.ts`. O fix certo é no build do DS
  (unplugin-dts); ao corrigir lá, remover o shim daqui.

## Regras técnicas

- Astro 7 + Tailwind v4: `@import 'tailwindcss'` **antes** de `ds-grupo-rkb/style.css`
  no `global.css`; Vue via `@astrojs/vue`.
- Tema da marca: `<body data-theme="fibramfer">` definido no `BaseLayout.astro`
  (mais Google Fonts Barlow Condensed/Inter/JetBrains Mono).
- Título da página: prop `title` do `BaseLayout` (nunca `<title slot="title">`).
- Blog: coleção `blog` (`src/content.config.js`, glob loader); links usam `post.id`;
  render com `render(post)` + `<Content />`.
- Scroll one-page: delegação de eventos no `<header>` (o CTA "Contato" fica fora do
  `<nav>`, e o menu mobile é renderizado depois pelo Vue); scrollspy só aplica sublinhado
  em links do `<nav>` (nunca no CTA). Snap em `proximity` (não `mandatory` — trava o footer).
- Botão: variantes só `primary | secondary | ghost` (**não existe `outline`**);
  `rounded-button` + `font-medium` vêm do tema; sem `uppercase` em títulos.
- Tokens de cor: `text-ink`, `text-text-secondary`, `bg-surface(-alt/-brand)`,
  `text-primary-500`, `text-accent-500` (gold), `text-success-500`, `border-border`,
  `shadow-elevation-1/2/3`, `shadow-card`, `rounded-lg`, `font-display`.

## Valide sempre ao final

- `npx astro check` 0 erros + `npm run build` com 9 páginas.
- Greps de blindagem em `src/**/*.{astro,css}`: nenhum `indigo|gray|blue|green-[0-9]`,
  `rounded-xl|2xl|3xl`, `shadow-sm|md|xl`, `variant="outline"`, `bg-white`,
  `text-white|text-black`, `undefined`.
