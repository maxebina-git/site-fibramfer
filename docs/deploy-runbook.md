# Deploy — site-fibramfer

## Já configurado

- [`astri-check`]: 0 erros / `npm run build`: 12 páginas OK
- `src/components/sections/CadeiraSuspensa.astro`: section CTA inserida + margem 48px
- `src/components/sections/Contact.astro`: placeholder atualizado
- `lazy-load GSAP`: HeroCurveSlider, FibramferCurveSlider, HeroCurveSliderSquare, ChairDraw, Header
- `.github/workflows/deploy.yml`: workflow FTP atualizado com `secrets.*`, `ftp-port: 20021`, `protocol: ftp`, `ftp-dir: /public_html/site-novo` (placeholder)
- `DEPLOY.md`: criado no root
- Repositório GitHub: `https://github.com/maxebina-git/site-fibramfer` (main push feito)

## Ainda falta configurar

- [ ] Confirmar caminho real `ftp-dir` no host (`/public_html/site-novo`? `/site-novo`? `/htdocs/site-novo`?) — aguardar host voltar
- [ ] Ajustar `.github/workflows/deploy.yml`: `ftp-dir` para o path real confirmado
- [ ] Adicionar 5 Secrets no GitHub (`Settings → Secrets → Actions`):
  - `FTP_SERVER`: `ftp.fibramfer.com.br`
  - `FTP_USERNAME`: `fibrerbr`
  - `FTP_PASSWORD`: `AY7dikWYmVh`
  - `FTP_PORT`: `20021`
  - `FTP_PROTOCOL`: `FTP`
- [ ] Confirmar se host tem PHP ativo (`public/admin.php` precisa executar)
- [ ] Fazer `git push` após ajustar `ftp-dir`
- [ ] Verificar Actions -> confirmar deploy sem erro
- [ ] Validar site no ar: `https://fibramfer.com.br/site-novo/`

## Quando confirmar o `ftp-dir`

1. Editar `.github/workflows/deploy.yml`: substituir `/public_html/site-novo` pelo path real
2. `git add .github/workflows/deploy.yml && git commit -m "fix: ajustar ftp-dir após confirmar host"`
3. `git push`
4. Acompanhar Actions → Deploy Astro site
