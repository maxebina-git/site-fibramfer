# Deploy — site-fibramfer

## Já configurado

- [`astri-check`]: 0 erros / `npm run build`: 12 páginas OK
- `src/components/sections/CadeiraSuspensa.astro`: section CTA inserida + margem 48px
- `src/components/sections/Contact.astro`: placeholder atualizado
- `lazy-load GSAP`: HeroCurveSlider, FibramferCurveSlider, HeroCurveSliderSquare, ChairDraw, Header
- `.github/workflows/deploy.yml`: workflow FTP atualizado com `secrets.*`, porta `20021`, protocolo `FTP`, `server-dir: /fibramfer.com.br/www/site-novo/`
- `DEPLOY.md`: criado no root
- Repositório GitHub: `https://github.com/maxebina-git/site-fibramfer` (main push feito)
- GitHub Secrets (Actions): 5 adicionados (`FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_PORT`, `FTP_PROTOCOL`)

## Ainda falta configurar

- [x] Confirmar caminho real `server-dir` no host (`/fibramfer.com.br/www/site-novo/` via FTP)
- [x] Ajustar `.github/workflows/deploy.yml`: `server-dir` para `/fibramfer.com.br/www/site-novo/`
- [x] Configurar `astro.config.mjs`: `base: '/site-novo/'` (subpasta)
- [x] Validar dev (`/site-novo/`) — imagens e Lord Icons retornando `200`
- [x] Adicionar 5 Secrets no GitHub (`Settings → Secrets → Actions`):
  - `FTP_SERVER`: `ftp.fibramfer.com.br`
  - `FTP_USERNAME`: `fibrerbr`
  - `FTP_PASSWORD`: configurado somente nos Secrets do GitHub Actions
  - `FTP_PORT`: `20021`
  - `FTP_PROTOCOL`: `FTP`
- [ ] Confirmar se host tem PHP ativo (`public/admin.php` precisa executar)
- [x] Fazer `git push` após ajustar `ftp-dir`
- [ ] Verificar Actions -> confirmar deploy sem erro
- [ ] Validar site no ar: `https://fibramfer.com.br/site-novo/`

## Quando confirmar o `server-dir`

1. Editar `.github/workflows/deploy.yml` com o caminho real confirmado no FTP
2. `git add .github/workflows/deploy.yml && git commit -m "fix: ajustar server-dir após confirmar host"`
3. `git push`
4. Acompanhar Actions → Deploy Astro site
