# Deploy — site-fibramfer

## Visão geral

- **Build:** `npm run build` (Astro static → `dist/`), 12 páginas
- **Deploy:** FTP via GitHub Actions (`SamKirkland/FTP-Deploy-Action@4.3.3`)
- **Trigger:** push para `main` + manual (`workflow_dispatch`)
- **Host:** `fibramfer.com.br/site-novo`
- **Protocolo:** FTP simples (porta 20021)

---

## Secrets necessários

Configurar no GitHub: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|-------|
| `FTP_SERVER` | `ftp.fibramfer.com.br` |
| `FTP_USERNAME` | `fibrerbr` |
| `FTP_PASSWORD` | `AY7dikWYmVh` |
| `FTP_PORT` | `20021` |
| `FTP_PROTOCOL` | `FTP` |

---

## Como configurar (passo a passo)

1. **Criar repositório remoto** (se ainda não existir):
   ```bash
   git remote add origin https://github.com/maxebina-git/site-fibramfer.git
   git branch -M main
   git push -u origin main
   ```

2. **Adicionar Secrets no GitHub:**
   - Acesse o repositório no GitHub
   - Settings → Secrets and variables → Actions
   - Clique em **New repository secret** para cada um dos 5 itens da tabela acima

3. **Ajustar `ftp-dir` no workflow:**
   - Editar `.github/workflows/deploy.yml`
   - Alterar `ftp-dir` para o caminho real no servidor (ex.: `/site-novo`, `/htdocs/site-novo`, `/public_html/site-novo`)
   - Commit + push para disparar o workflow

---

## Como rodar o deploy

- **Automático:** qualquer `push` na branch `main` dispara o workflow
- **Manual:** Actions → **Deploy Astro site** → **Run workflow**

---

## Resultado esperado

Sucesso:
- `dist/` enviado via FTP para `ftp.fibramfer.com.br/site-novo`
- Site acessível em `https://fibramfer.com.br/site-novo/`

Falha:
- Verificar a aba **Actions** no GitHub para o log do erro
- Erros comuns: `ftp-dir` inexistente, credenciais erradas, firewall bloqueando porta 20021

---

## Rollback

- Actions → histórico de runs → selecionar run anterior → **Re-run jobs**

---

## Observações

- O site é estático (HTML/CSS/JS) gerado pelo Astro
- `admin.php` em `public/api/` requer **PHP habilitado** no servidor web (conforme confirmado com o host)
- O `ftp-dir` ainda é placeholder até você confirmar o caminho real no servidor (aguardando retorno do host)