# Verificação do indicador de rolagem e da badge

```sh
npx astro check
npm run build
npm run preview -- --port 4321
```

Abra `http://localhost:4321/` em desktop, com animações habilitadas.

1. Aguarde a primeira entrada: a badge desenha o contorno após 1 s, por 1 s;
   letras e fundo começam após 2,1 s. As letras entram com intervalo de 35 ms.
   O indicador começa a aparecer após cerca de 4 s, em um ciclo de 12 s;
   o pontinho do mouse pisca em um ciclo separado de 1 s.
2. Abra Produtos, troque para Privacidade e Termos e feche pelo logo ou X.
   O grupo permanece oculto e parado até o painel sair completamente.
3. Após a saída, os dois grupos ganham um novo relógio com os mesmos tempos
   do primeiro passo. As setas começam no primeiro frame e voltam ao loop.
4. Reabra enquanto o painel fecha ou enquanto a badge está desenhando.
   O início antigo deve ser cancelado; só o próximo fechamento completo
   produz um novo replay, sem flashes ou animações concorrentes.
5. Entre diretamente e use F5 em `/produtos/` e `/privacidade/`. O grupo
   começa oculto/parado e deve reiniciar após o fechamento, inclusive com
   carregamento natural das fontes e hidratação do header.
6. Com movimento reduzido, o grupo continua oculto sob o painel e volta
   diretamente à pose final estática. As setas não devem ser forçadas a animar.

No celular, o slot CTA desktop permanece oculto. Quando o menu móvel renderiza
uma cópia do grupo, ela segue o mesmo ciclo. As rotas legais ocultam o botão
do menu intencionalmente: feche o painel legal antes de abrir o menu para
inspecionar essa cópia. Não force a exibição do slot desktop para testar.

## Expansão da badge sincronizada com a cadeira

Depois da entrada temporizada, a badge mantém a largura determinada pelo título
e revela o texto abaixo conforme a cadeira colorida avança:

> Equipamento certificado e em total acordo com a Norma Regulamentadora nº 18
> (Portaria 13 de 09.07.2002) do Ministério do Trabalho e Emprego.

1. No topo da home, o texto explicativo fica dentro da largura do título, mas
   permanece recortado; o contorno inferior corresponde à altura recolhida.
2. Role até a metade e depois até o fim. A altura visível, o contorno, o texto
   e o fundo acompanham a cadeira com atraso real de 500 ms. O amarelo final
   usa `var(--color-surface-brand)`.
3. Role de volta ao topo e confira a reversão proporcional: a badge retorna ao
   estado recolhido e o fundo volta a `var(--color-surface)`.
4. Abra um drawer com progresso parcial. A badge deve ficar oculta e o
   progresso compartilhado deve voltar a zero. Depois de fechar, a próxima
   descida começa na posição atual, sem recuperar o progresso anterior.
5. Repita no menu móvel aberto. A cópia visível deve usar o mesmo progresso da
   cadeira; a cópia desktop naturalmente oculta não entra na inspeção visual.
6. Com movimento reduzido, a badge deve aparecer completa, sem recorte e com o
   fundo amarelo estático.

O sincronismo usa o progresso do `ScrollTrigger` existente em
`src/components/ChairDraw.astro`, publicado como `fibramfer:chair-progress`;
não há um segundo trigger nem cálculo paralelo baseado em `window.scrollY`.

Existe também uma segunda cópia desktop, ancorada 16 px acima e à esquerda da
caixa da cadeira. Ela usa temporariamente o mesmo título/texto e um atraso de
250 ms; a badge do CTA mantém o atraso de 500 ms. Essa segunda cópia fica oculta
em larguras mobile até receber conteúdo e posicionamento próprios.

O ciclo é controlado em `src/components/Header.astro`, por presença real do
painel, estado por instância e cancelamento dos frames/fontes pendentes.

## Validação conjunta — 2026-10-19

- `npx astro check`: 0 erros; permanece o hint anterior sobre `home` não usado.
- `npm run build`: 9 páginas geradas.
- Header fixo, navegação e rodapé: aprovados nas 9 rotas em desktop e celular.
- Escala do logo, redução/restauração do H1, texto/CTAs e hero: aprovados nos
  fluxos que renderizam o hero da home.
- Cadeira: 427 verificações do fluxo e 337 de casos limites aprovadas, incluindo
  scroll máximo, histórico, resize e interrupção do desenho por um novo drawer.
- Visibilidade dos indicadores: 226 verificações aprovadas; 14 verificações de
  reaparecimento não se aplicam ao CTA desktop naturalmente oculto no celular.
- Reinício das duas animações: 500 verificações aprovadas, incluindo movimento
  reduzido, F5, trocas entre painéis e cancelamento de replays anteriores.
- O histórico foi conferido com a restauração nativa habilitada e a posição
  registrada de cada entrada, sem forçar todas as entradas ao mesmo scroll.

### Validação da expansão — 2026-10-19

- Desktop 1440×900: progresso `0 → 0,5 → 1 → 0` alterou clip, altura do
  contorno e fundo sem alterar a largura de 268,6875 px da badge.
- Desktop com drawer: progresso parcial foi zerado na abertura; após fechar no
  mesmo scroll, a nova revelação avançou somente ao descer além da posição de
  replay.
- Movimento reduzido: badge completa, contorno completo e fundo
  `rgb(255, 251, 235)` sem scroll-driven animation.
- Mobile 390×844 com menu aberto: a cópia visível recebeu o mesmo progresso
  (`0,375939`) e revelou o texto explicativo.
- Atraso scroll-driven: a badge do header usa `500 ms` e a badge da cadeira
  usa `250 ms`; os endpoints chegam a `1` após as respectivas amostras
  atrasadas.
- A expansão e o recolhimento das duas badges usam a curva `power2.inOut`;
  os endpoints continuam respeitando os atrasos configurados.
- `npx astro check`: 0 erros; permanece o hint anterior sobre `home` não usado.
- `npm run build`: 9 páginas geradas.

Evidência de Chromium headless (celular emulado), DOM, estilos e amostras por
frame; não é comparação de pixels nem teste em todos os navegadores. Os dois
casos de cadeira no acesso direto/F5 ao post continuam não aplicáveis porque
essa página já não a renderiza; o post aberto pela home foi validado.

O comando `npm test` ainda é o placeholder anterior do projeto, não uma suíte
automatizada configurada. Os roteiros deste arquivo e de
`docs/chair-drawer-smoke.md` permitem repetir a conferência no preview.
