# Slider automático: regressão de reload

## Causa e correção

No acesso direto a `/a-fibramfer/`, o script inicializava o slider do HTML
SSR antes da hidratação. O adaptador Astro/Vue lê o slot como `innerHTML` e
o Drawer pode recriar os elementos durante a montagem. A cópia herdava
`data-curve-ready="true"`, mas não o timer do elemento original. O observer
ignorava a cópia por causa desse atributo; o timer original parava ao detectar
que seu elemento não estava mais conectado.

`HeroCurveSlider.astro` agora aguarda a hidratação da ilha, escuta
`astro:hydrate` em capture e registra instâncias pela identidade dos elementos.
O atributo `data-curve-ready` serve apenas para diagnóstico. A montagem dinâmica
continua acompanhada por MutationObserver; timers e timelines são destruídos
quando seus elementos saem ou seus slides são substituídos.

O slideshow permanece sem controles. Hover, swipe e teclado não pausam nem
trocam imagens. O intervalo é de 3 segundos em A Fibramfer, com o mesmo morph
SVG de 0,5 segundo. A preferência de movimento reduzido desativa o autoplay;
a aba oculta não avança os slides.

## Teste automatizado

Requer as dependências do projeto instaladas, Node >=22 e um Chrome/Chromium
local. O teste usa o protocolo de depuração do navegador, sem instalar pacotes
ou baixar navegadores. Cria e remove seu próprio perfil temporário; não usa o
perfil pessoal. As fontes externas são bloqueadas, permitindo rodar offline
com o site servido localmente.

Prepare a versão de produção, em um terminal:

```sh
npx astro check
npm run build
npm run preview -- --port 4335
```

Em outro terminal PowerShell:

```powershell
$env:CHROME_PATH = '<executavel-local-do-Chrome-ou-Chromium>'
$env:BASE_URL = 'http://localhost:4335'
npm run test:slider
```

Em Linux, com `chromium` no PATH:

```sh
CHROME_PATH="$(command -v chromium)" BASE_URL=http://localhost:4335 npm run test:slider
```

Também é possível testar o dev: execute `npm run dev` e use
`BASE_URL=http://localhost:4334` (padrão do script). Não rode build/check em
paralelo com a suíte no dev: eles podem invalidar o cache de dependências do
Vite. Se aparecer `504 Outdated Optimize Dep`, reinicie o servidor de dev.

### Cobertura

- Acesso direto, reload com cache e reload sem cache.
- Pelo menos duas trocas completas e múltiplas alterações do path SVG por caso.
- Cópia do DOM no meio do morph, mantendo a marca `data-curve-ready`.
- Limpeza da instância removida, incluindo navegação entre drawers.
- Ausência de comandos de hover, swipe e teclado; autoplay continua no hover.
- Home → A Fibramfer → Cadeira Suspensa (três instâncias) → A Fibramfer.
- Reload em viewport de 390 × 844.
- Movimento reduzido no reload e retomada ao desativar a preferência.
- Ausência de exceções JavaScript e respostas HTTP de erro.

## Conferência manual

1. Abra `/a-fibramfer/` diretamente e aguarde pelo menos 8 segundos.
2. Confirme a alternância das duas fotos com a transição curva, sem controles.
3. Pressione F5 e depois Ctrl+R; repita a espera após cada reload.
4. Deixe o mouse sobre a imagem: as trocas devem continuar.
5. Feche e reabra o Drawer e navegue entre A Fibramfer e Cadeira Suspensa.
6. Repita no celular e confira com as fontes reais e a preferência de
   movimento reduzido do sistema.

## Validação de 23/10/2026

- Falha original reproduzida em Chrome headless: cópia conectada com `ready=true`,
  apenas o timer do nó removido, primeiro slide parado após 7,5 segundos e reload.
- Suíte acima passou no preview de produção e no servidor de desenvolvimento.
- `npx astro check`: 0 erros, 0 warnings, 1 hint preexistente em BaseLayout.
- `npm run build`: 11 páginas; aviso de chunk maior que 500 kB.
- As 11 rotas refletem o projeto atual; a instrução antiga de 9 páginas não
  inclui todas as rotas existentes.
