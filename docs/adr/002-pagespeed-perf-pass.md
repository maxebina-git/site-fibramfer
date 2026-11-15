# ADR 002: PageSpeed Performance Pass (fonts self-hosted, cache headers, critical-chain trims)

## Status
Accepted

## Context
PageSpeed Insights (15/11/2026) for `http://fibramfer.com.br/site-novo/` showed:
Desempenho 99, Acessibilidade 100, Práticas recomendadas 78, SEO 100.
The red items were not code-architecture issues, but they are
actionable on our side:

- Render-blocking Google Fonts stylesheet in `BaseLayout.astro` (~200 ms).
- Static assets served without long-lived cache headers (~209 KiB re-download);
  the host is Apache (PHP enabled) and the deploy is FTP via GitHub Actions,
  so repo-level `.htaccess` is the lever we have.
- Hero chair image (`cadeira-suspensa-no-bg.png`, 87 KB) convertible to WebP (~50 KiB saved).
- `@lordicon/element` player bundled eagerly (213 KB) though every icon is decorative
  (hover/scroll affordances); `decap-cms-app` installed but unused.
- Badge entrance animations use non-composited properties (`stroke-dashoffset`,
  `background-color`).
- The 78 in Práticas recomendadas comes from running the test over plain HTTP;
  re-testing via `https://` should clear it (TLS/HSTS are host-level, outside this repo).

## Decision

### Fonts: self-host via Fontsource (static packages)
We replace the render-blocking Google Fonts `<link>` with locally emitted fonts:
`@fontsource/barlow-condensed` (400/600/700/800/900),
`@fontsource/inter` (300/400/500/600/700) and
`@fontsource/jetbrains-mono` (400/500/700), imported in `src/css/global.css`.

- Static packages (not variable) so the emitted family names match the DS tokens
  verbatim (`Barlow Condensed`, `Inter`, `JetBrains Mono`); no theme changes.
- Barlow Condensed has no `@fontsource-variable/*` package, and the Inter /
  JetBrains Mono variable builds rename the family (`Inter Variable`, etc.),
  which would force token changes for no practical gain.
- Fonts ship in the build as hashed `_astro/*` assets → covered by the immutable
  cache rule below. External request to `fonts.googleapis.com` disappears.
- `font-display: swap` is set by the Fontsource CSS.

### Cache: `public/.htaccess` shipped via FTP
`_astro/*` (hashed) → `Cache-Control: max-age=31536000, immutable`;
static media (`assets`, `uploads`, `lordicon`, images, fonts, `favicon*`) → 30 days.
Depends on Apache `mod_headers`/`AllowOverride` at the host; to be confirmed
after the first deploy of this file. If unsupported, cache tuning moves to the
host panel.

### Critical chain / payload trims
- Hero chair image converted to WebP; `fetchpriority="high"` on the `<img>`.
- LordIcon player registered lazily (`requestIdleCallback`, falling back to `load`);
  icons are decorative only.
- `decap-cms-app` removed (unused).
- `badge-bg-fade` reworked to animate opacity of a `::before` fill layer (composited);
  `badge-stroke-draw` kept (no composited equivalent for `stroke-dashoffset`; paint-only,
  short-lived).

## Consequences
- Positive: no external font origin (one less render-blocking dependency and
  third-party request); hashed assets get permanent cache; ~90–110 KiB less
  above-the-fold transfer; build remains static and deterministic.
- Negative: 5 extra npm dependencies; `public/.htaccess` only helps if the host
  honors it (otherwise it is inert); LordIcon icons hydrate a frame later
  (decorative, acceptable); the checklist below tracks what is verified vs.
  what needs a re-test after deploy (PageSpeed must be run over HTTPS).

## Execution checklist

- [x] 1. Fonts self-hosted (Fontsource) + Google Fonts link removed from `BaseLayout.astro`
- [x] 2. Chair image WebP + `fetchpriority="high"`
- [x] 3. LordIcon loaded on idle; `decap-cms-app` removed
- [x] 4. `badge-bg-fade` animates opacity (composited)
- [x] 5. `public/.htaccess` cache rules; `dist/` clean of `fonts.googleapis.com`.

  Verificação final (15/11/2026): `dist/` não contém referências a
  `fonts.googleapis.com`/`fonts.gstatic.com` em nenhuma página da app (a única
  ocorrência restante é `public/style-guide/index.html`, legado congelado — ver
  AGENTS.md). Cadeira servida como `.webp` e fora do HTML inicial está só o
  player LordIcon (carregado via `requestIdleCallback` pós-`load`).
  `.htaccess` presente em `dist/` e será enviado no próximo deploy de `main`.
  **Pendente após o deploy:** re-rodar o PageSpeed sobre `https://` (o score de
  "Práticas recomendadas" depende do TLS/host, não deste repo) e confirmar no
  DevTools → Network que os assets respondem com o `Cache-Control` esperado
  (`_astro/*` immutable 1y; imagens 30d; HTML `no-cache`).

## Implications
- **Deploy:** `public/.htaccess` reaches production only via the GitHub Actions FTP
  workflow; host must allow `.htaccess`.
- **Testing:** each stage is independently verifiable with `npx astro check` +
  `npm run build` + manual pass on mobile and desktop.
- **Re-test:** PageSpeed Insights must be re-run over `https://` after the deploy;
  scores for Práticas recomendadas will reflect TLS state of the host, not this repo.
