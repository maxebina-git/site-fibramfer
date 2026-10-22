# Verificação dos painéis flutuantes (F1 e F2)

## Contexto

O componente `src/components/FibramferFloat.astro` renderiza um painel 3D
(Three.js) dentro de um slot de drawer. A arte e a silhueta vêm de um **asset**
(`src/lib/floatAssets.ts`):

| Asset | Arte | Onde | Formato |
|---|---|---|---|
| `f1` | `/assets/f1.png` | `a-fibramfer` (`Hero.astro`), `seguranca` (`Security.astro`), `termos` (`Termos.astro`) | retrato 97×306 |
| `f2` | `/assets/f2.png` | `produtos` (`Products.astro`), `blog` (`BlogList.astro`) | paisagem 211×97 |
| `f3` | `/assets/f3.png` | `onde-comprar` (`OndeComprar.astro`), `contato` (`Contact.astro`), `privacidade` (`Privacidade.astro`), `blog-posts` (`BlogPostDrawer.astro`) | quadrado 71×71 |

Cada slot renderiza o **par** (original + espelhado). O componente é o mesmo
para todos: o script o descobre pelo atributo `data-fibramfer-float-root`, então
cada página nova só precisa importar o componente e renderizar o par com o
asset desejado.

Cada slot renderiza o **par**: o painel original e a variante espelhada.

## Regras do componente

1. **Ancoragem**: o stage precisa estar dentro de `[data-drawer-reveal-content]`
   do `aside[role='dialog']` para medir a moldura e localizar as gates.
2. **Cortina**: só aparece com `drawer-reveal-gates--open`; antes disso fica em
   `opacity: 0` e `translate3d(0, 200px, 0)`.
3. **Entrada**: aplica `--open` (transform + `opacity: 1`) e `--foreground`
   (`z-index: 12`, à frente das linhas da moldura em z-11) **depois** que a
   cortina termina, usando a duração do DS (`--drawer-reveal-gate-duration`).
   O eixo é por asset (`enterAxis`): o painel vem de um lado e volta pelo
   mesmo lado — `y` para o F1 (sobe/desce), `x` para o F2 (desliza da direita
   para a esquerda e vice-versa).
4. **Saída**: `fibramfer:drawer-close` (delay 500ms = `reveal-close-delay` do
   DS) → `--open--closing` → fade/slide de 500ms.
5. **Movimento reduzido**: sem transição e sem loop de animação; entrada
   imediata.
6. **Fallback**: sem WebGL/`three`/textura → canvas oculto e o PNG do asset
   visível.
7. **Limpeza**: `dispose` ao sair do DOM (troca de slot), cancelando RAF,
   observers e recursos de GPU.
8. **Tokens**: `var(--duration-500)` / `var(--ease-out)` do DS; nada de cor,
   raio ou sombra próprios.
9. **Flutuação**: movimento contínuo do modelo 3D dentro do canvas, com
   levitação, guinada, inclinação, balanço e deriva lateral. A arte ocupa
   ~92% da altura do canvas, então a levitação é limitada pela folga vertical
   real (nunca encosta na borda); a guinada tem folga horizontal de sobra e
   é o eixo mais perceptível (a vista de cima "esterça"). Em movimento
   reduzido o modelo fica estático e o PNG de fallback não anima.
10. **Variante espelhada** (`<FibramferFloat mirror />`): segunda instância
    do mesmo componente, ancorada no canto inferior direito da viewport
    (`right`/`bottom` com clamp), entrando de cima para baixo e saindo de
    baixo para cima. É o **painel girado 180º no plano da tela** (reflexão
    pontual, esq↔dir e cima↔baixo), conforme a referência `public/assets/f1e.png`:
    arte, silhueta e face lateral viram juntos.
11. **Asset por instância**: a chave vem de `data-fibramfer-float-asset` e a
    config (textura, silhueta, medida no mundo, profundidade, eixo de
    entrada, escala da flutuação e enquadramento) vem de
    `src/lib/floatAssets.ts`. O eixo vai para o DOM em
    `data-fibramfer-float-axis` e o CSS transforma em `--enter-x`/`--enter-y`.
12. **Enquadramento**: a câmera tem o mesmo fov (34°) nos assets e a distância
    é calculada pela altura do painel. Um painel **largo** chega muito mais
    perto da câmera na borda da frente, então a mesma guinada o deforma bem
    mais que um painel retrato — por isso o F2 usa yaw/pitch menores
    (`baseYaw`/`basePitch` por asset) e um enquadramento próprio.
13. **Scrollbar do drawer**: quando o conteúdo do drawer fica rolável
    (`data-drawer-scrollable`, toggado pelo `NavigationDrawer`), a scrollbar
    da marca (8px) ocupa a borda direita do painel. O painel flutuante
    espelhado recua **0,5rem** — o mesmo delta do botão fechar (regra em
    `src/css/global.css`) — para não cobrir a scrollbar. Por isso a posição
    do espelhado vai para `--float-right`/`--float-bottom` (variáveis CSS) e
    não para `right`/`bottom` inline: inline venceria a regra do CSS.

## Preparação

```sh
npx astro check
npm run build
npx astro preview -- --port 4321
```

Abra `http://localhost:4321/a-fibramfer/` e `http://localhost:4321/produtos/`.
Execute em desktop e celular, com animações habilitadas e depois com a
preferência de movimento reduzido.

## Fluxo esperado

1. Carregue `/a-fibramfer/` direto. A cortina abre; o F1 só entra depois que
   ela termina e assenta com `opacity: 1`, `transform: none` e `z-index: 12`.
2. Confirme que o F1 fica ancorado no canto superior esquerdo do painel, sem
   alterar o layout do texto (o stage é `position: fixed`).
3. Feche o drawer. O F1 sai em conjunto com a cortina (500ms de atraso +
   500ms de transição) e some antes do painel.
4. Troque de rota (Produtos → A Fibramfer). O F1 é remontado, permanece
   oculto durante a troca da cortina e entra depois dela.
5. Com movimento reduzido, o F1 aparece instantaneamente, sem slide e sem
   loop de animação, e continua renderizado.
6. Bloqueie WebGL/`three`: o PNG `/assets/f1.png` deve aparecer no lugar do
   canvas, na mesma âncora.
7. No mobile (<768px) o painel é full-width: o F1 não pode ultrapassar a
   borda esquerda da viewport.
8. A flutuação deve ser visível a olho nu (o F1 "respira" e o carro esterça
   de leve) e a arte nunca pode encostar na borda do canvas.
9. Na `/a-fibramfer` devem existir **dois** F1: o original no canto superior
   esquerdo do painel e o espelhado no canto inferior direito da tela
   (`right: 0`, encostando na borda).
10. O espelhado deve entrar descendo (de cima para baixo) e sair subindo,
    enquanto o original sobe ao entrar e desce ao sair.
11. O espelhado é o F1 de cabeça para baixo: o corte diagonal da silhueta
    fica no **topo-esquerdo** (e não embaixo à direita) e a arte aparece
    invertida, igual à referência `public/assets/f1e.png`.
12. Na `/produtos` devem existir **dois** F2 (painel paisagem): o original no
    canto superior esquerdo do painel e o espelhado no canto inferior direito
    da tela, com o mesmo par de entrada/saída do F1 — mas **lateral**: o
    original desliza da direita para a esquerda ao entrar e da esquerda para
    a direita ao sair; o espelhado faz o inverso.
13. O F2 é um painel largo: a diagonal de 45° fica à **direita** e a base
    ocupa ~54% da largura à esquerda; o espelhado inverte tudo (180º).

## Validação executada — 2026-10-21

Medido via CDP em Chromium headless (1440x900 e 390x844), sobre o build
estático servido por `astro preview`.

| Cenário | Resultado |
|---|---|
| Load direto `/a-fibramfer/` | t=1.5s oculto (`opacity 0`, `translateY 200`) → t=3.0s em transição (`opacity 0.60`) → t=4.5s assento (`opacity 1`, `translateY 0`, `z-index 12`) |
| Movimento reduzido | `--open` + `opacity 1` já em t=1.5s, `transform: none` |
| Movimento reduzido (pixel a pixel) | 20 frames consecutivos, 0 pixel alterado (modelo estático) |
| Troca de rota (Produtos → A Fibramfer) | sem stage até +2.0s → monta em +2.5s → `--open` em +3.5s → `opacity 1` em +4.0s |
| Sem WebGL (`--disable-webgl`) | `canvas hidden`, fallback PNG visível com a animação `fibramfer-float` |
| Fechamento | `--open--closing`, `opacity → 0`, `z-index → 1` |
| Fechar/reabrir em movimento reduzido | o canvas volta a renderizar (nada de quadro em branco) |
| Âncora desktop | painel em x=360, moldura em x=384, stage em x=355 (5px à esquerda do painel) |
| Âncora mobile | stage em x=0 (antes ficava em -5, 5px fora da viewport) |
| Render 3D | região do F1 com 538 cores distintas (controle ao lado: 30) |

### Flutuação (bbox da silhueta, 30 frames a 200ms)

| | Vertical p2p | Horizontal p2p | Folga sup./inf. mínima |
|---|---|---|---|
| Antes (desktop) | 1px | 0px | 6px / 4px |
| **Depois (desktop)** | **5-6px** | **3-4px** | 4px / 2px |
| **Depois (mobile)** | **3-5px** | **2-4px** | 3px / 1px |

A folga restante garante que a frente do F1 nunca encosta na borda do canvas
no pico da curva.

## Variante espelhada

### A base: `public/assets/f1e.png`

O arquivo de referência do F1 espelhado (`public/assets/f1e.png`, 97x306) é o
`public/assets/f1.png` **girado 180°**, medido pixel a pixel:

| Comparação (conteúdo RGB, só pixels opacos nos dois) | MAD médio |
|---|---|
| `f1e` vs `f1` (identidade) | 56,30 |
| `f1e` vs `f1` espelhado em X | 56,31 |
| `f1e` vs `f1` espelhado em Y | **0,47** |
| `f1e` vs `f1` rotacionado 180° | **0,47** |

A arte é simétrica no eixo X (por isso o espelho em Y e a rotação de 180°
dão o mesmo conteúdo), mas a **silhueta** distingue os dois casos: o corte
diagonal do canto inferior-direito do `f1.png` vira o corte do canto
**superior-esquerdo** no `f1e.png` — que é exatamente a rotação de 180°.

Por isso a implementação espelha **o F1 inteiro** (giro de 180° no plano da
tela), e não só a arte em X.

### Implementação

- `src/components/FibramferFloat.astro`: a instância espelhada monta o
  modelo 3D dentro de um grupo com `rotation.z = Math.PI`
  (`scene → flip → model → extrusion + front`). Arte, silhueta e face lateral
  viram juntos, sem mexer na textura (`repeat.x`/`offset.x`) nem no shape.
- O deslocamento base (`floatBaseOffset`) tem o sinal trocado no espelhado,
  porque o grupo inverte o eixo Y local — assim o espelhado fica na mesma
  altura de tela que o original.
- O fallback (sem WebGL) usa `rotate(180deg)` em
  `@keyframes fibramfer-float-mirror`, o que equivale a usar o `f1e.png`
  sem depender do arquivo novo.

### Validação executada — 2026-10-21 (giro de 180º)

Captura via CDP do canvas do espelhado (1440x900) comparada com a referência.

| Cenário | Resultado |
|---|---|
| Perfil de tinta do render vs `f1e.png` | **corr = +0,59** (com o `f1e` invertido: -0,58; com o `f1` como está: -0,58) |
| Perfil de tinta do render normal vs `f1.png` | corr = +0,66 (referência de escala do mesmo tipo de comparação) |
| Corte diagonal | 5 primeiras faixas do render espelhado: 0px à esquerda, tudo à direita — igual ao `f1e.png` (0px à esquerda) e o oposto do `f1.png` (cheio no topo) |
| Forma da silhueta | o `f1e` tem o corte no topo-esquerdo; o render espelhado reproduce a mesma rampa de ocupação (0 → 336 px/faixa) |
| Âncora desktop | `right: 0px`, `bottom: 13px`, stage em x=1336 (1440-104) |
| Entrada | espelhado `translateY -200 → 0` (desce); normal `+200 → 0` (sobe) |
| Saída | espelhado `0 → -200` (sobe); normal `0 → +200` (desce) |
| Flutuação (30 frames a 200ms) | espelhado: 5px vertical, 4px esq / 3px dir; normal: 6px, 3px esq / 4px dir (movimento horizontal invertido) |
| Folga da arte | espelhado 2px sup. / 4px inf.; normal 2px / 3px |
| Mobile 390x844 | `right: 0px`, `bottom: 13px`, stage em x=310 (390-80) |
| Movimento reduzido | `transform: none` nos dois, `opacity: 1` |
| Sem WebGL | espelhado com `fibramfer-float-mirror` e `matrix(-1, 0, 0, -1, …)` (= rotate 180°) |
| Troca de rota | `/produtos/` → 0 instâncias; `/a-fibramfer/` → 2 instâncias |

## F2 (painel paisagem) na página `/produtos/`

### O asset

`public/assets/f2.png` (211×97): gradiente **horizontal** (R 40 → 155 da
esquerda para a direita) e silhueta de trapézio com a diagonal de 45° à
direita — a base ocupa 114 px (~54% da largura) encostada na esquerda.

### Config

`src/lib/floatAssets.ts` (config por asset, consumida pelo frontmatter e pelo
script):

| | f1 | f2 |
|---|---|---|
| Textura | `/assets/f1.png` | `/assets/f2.png` |
| Mundo (w×h) | 1,55 × 4,9 | 4,9 × 2,253 |
| Silhueta (normalizada) | `(-0,5;0,5) (0,5;0,5) (0,5;-0,184) (-0,5;-0,5)` | `(-0,5;0,5) (0,5;0,5) (0,0355;-0,5) (-0,5;-0,5)` |
| Profundidade | 0,62 | 0,62 |
| Stage desktop | 104×184 | 184×84 |
| Stage mobile | 80×128 | 128×80 |
| `floatScale` | 1 | 0,46 |
| `rotationScale` (rotações da flutuação) | 1 | 0,9 |
| `slab` (laje/espessura) | 0 (sem aresta) | **0,16** |
| `anchorShift` (recuo do canto) | 0 | **10px** |
| `enterAxis` (entrada/saída) | `y` (vertical) | `x` (lateral) |
| `baseYaw` / `basePitch` | 0,24 / 0,10 | 0,20 / 0,10 |
| `artFill` (enquadramento) | 0,9226 | 0,68 |
| Altura de referência | 184px | 84px |

O `artFill` do F2 é menor de propósito: um painel largo aproxima muito mais a
borda esquerda da câmera (o yaw de 0,24 rad leva essa borda 26% mais perto) e
a arte estourava o canvas — com o enquadramento antigo a silhueta ocupava
100% da altura (margem 0) e o movimento vertical ficava cortado.

### Validação executada — 2026-10-21

| Cenário | Resultado |
|---|---|
| Instâncias em `/produtos/` | 2 (original + espelhado), com `data-fibramfer-float-asset="f2"` |
| Âncora desktop | original `left: 355px` / `top: 133px` (stage 184×84); espelhado `right: 0px` / `bottom: 13px` (x=1256) |
| Entrada/saída lateral | original `translateX +200 → 0` (vem da direita) e `0 → +200` (sai para a direita); espelhado `-200 → 0` (vem da esquerda) e `0 → -200` (sai para a esquerda) — `translateY` sempre 0 |
| Flutuação (30 frames a 200ms) | vertical 3-4px, horizontal 1-2px (o espelhado inverte o eixo horizontal) |
| Silhueta | 67-70px de 84, folga 5-7px em cima e embaixo (sem corte) |
| Gradiente | render normal escuro→claro (esq→dir) como o `f2.png`; espelhado invertido (corr +0,68 contra o `f2.png` espelhado em X, -0,67 contra o `f2.png` como está) |
| Mobile 390×844 | original `left: 0px` / `top: 109px`; espelhado `right: 0px` / `bottom: 13px` (stage 128×80) |
| Movimento reduzido | `transform: none`, `opacity: 1` |
| Sem WebGL | canvas oculto, fallback `/assets/f2.png` com `fibramfer-float` (original) e `fibramfer-float-mirror` (espelhado) |
| Troca de rota | em `/a-fibramfer/` só existem os dois F1 (`f1`, `f1:mirror`) — o F2 não é montado |
| Regressão do F1 | câmera recalculada em z=8,9998 (era 9): silhueta 172px e folga inferior 3px, iguais à medição anterior |
| Scrollbar do drawer | `/produtos/` já é rolável (`scrollHeight 800 > 732`): scrollbar em x=1408‑1416, X em `right: 32px`, espelhado do F2 em `right: 8px` (borda da arte em ~1408, colada na scrollbar) |
| Sem scrollbar | removendo o atributo, o espelhado volta a `right: 0px` (rect 1256‑1440) |
| Scrollbar no mobile | `/produtos/` 390×844: scrollbar em x=358‑366, espelhado em `right: 8px` (a arte termina em ~356) |
| F1 com scroll | `/a-fibramfer/` não é rolável (`732 = 732`): o espelhado do F1 segue em `right: 0px` |

### Calibração do F2 (2026-10-21)

O F1 estava bom e foi mantido intacto. O F2 é um painel **paisagem**: na mesma
guinada, a borda da frente chega muito mais perto da câmera, então a arte
saía deformada (a diagonal de 45° caía para 0,88) e o enquadramento ficava
folgado. O yaw/pitch passaram a ser por asset e foram calibrados por sweep
(4 combinações capturadas via CDP):

| yaw / pitch / artFill | diagonal | borda esq. | arte no canvas |
|---|---|---|---|
| 0,24 / 0,10 / 0,72 (antes) | 0,880 | -3px | 127×67px |
| 0,16 / 0,08 / 0,80 | **0,920** | -2px | **142×74px** |
| 0,12 / 0,06 / 0,85 | 0,940 | -1px | 153×75px |
| 0,08 / 0,05 / 0,88 | 0,940 | -1px | 159×76px |

Ficou **0,16 / 0,08 / 0,80**: a arte fica 12% maior e bem mais fiel ao PNG,
sem matar a perspectiva (que é o que dá o 3D). Medições finais: silhueta
72‑76px de 84 (folga 2‑3px, igual ao F1), flutuação 4‑5px vertical, mobile
390×844 com silhueta 68‑71px e folga 3/4px.

O F1 ficou **idêntico**: silhueta 172‑175px, folga 3/2px, flutuação 6px.

### Mais 3D no F2 (2026-10-21)

Duas alavancas, ambas só no F2 (o F1 foi mantido intacto):

1. **Perspectiva mais forte sem distorcer a arte**: o yaw do F2 foi para 0,20
   (com o pitch em 0,10, igual ao F1) e o `artFill` para 0,76. A diagonal do
   recorte ficou em **0,920** (o PNG tem 1,000) — ou seja, a arte continua
   fiel, mas o painel gira mais.
2. **As rotações da flutuação deixaram de escalar com a altura**
   (`rotationScale: 0,9`): um giro é um giro, então o painel baixo gira
   quase como o F1 em vez de acompanhar a altura. A flutuação vertical do F2
   foi de 3‑4px para **5‑6px** e a horizontal de 1‑2px para **2‑3px** — é o
   movimento que mais denuncia o volume.

Medições finais do F2: arte 135×71px no canvas de 184×84, silhueta 68‑74px
(folga 3/4px), flutuação vertical 5‑6px e horizontal 2‑3px; no mobile
390×844, silhueta 65‑70px e folga 3/4px. O F1 segue idêntico: silhueta
172‑175px, folga 3/2px e flutuação de 6px.

### Laje e escala do F2 (2026-10-21)

O F2 ganhou **volume geométrico**: a laje extrudada passou a ser o recorte do
PNG **expandido** (`slab: 0,16`) e a face frontal dela deixou de ser
invisível, então aparece uma **aresta cinza de ~3,5px** em volta da arte (o
F1 continua com `slab: 0` e a face frontal invisível, como está).

Junto veio a reancoragem e a escala:

| | antes | depois |
|---|---|---|
| F2 topo-esquerda (desktop) | x=355 | **x=365** (+10px para a direita) |
| F2 baixo-direita (desktop) | `right: 0` | **`right: 10px`** (10px para a esquerda) |
| F2 topo-esquerda (mobile) | x=0 | **x=10** |
| Stage do F2 (desktop) | 184×84 | **156×72** (−25%) |
| Stage do F2 (mobile) | 128×80 | **96×60** (−25%) |
| Arte no canvas | 135×71px | **115×61px** |
| Inclinação da diagonal | 0,920 | **0,947** (o PNG tem 1,000) |
| Silhueta / folga (desktop) | 68‑74px, 3/4px | 60‑65px, **2/3px** |
| Silhueta / folga (mobile) | 65‑70px, 3/4px | 49‑54px, **2/2px** |

O `anchorShift` é por asset e soma no `left` do painel original e no `right`
do espelhado — então o F2 recua 10px do canto em que está, e o F1 não se move.

## F3 (peça dourada) na página `/onde-comprar/`

`/assets/f3.png` (71×71) é a peça **dourada** da marca (RGB 254,230,5) em
formato quadrado, com a diagonal de 45° do topo-direito para o canto
inferior-esquerdo (a silhueta é um triângulo). Segue o mesmo modelo do F1
(f1 em `a-fibramfer`, f2 em `produtos`): o par original + espelhado, entrada
vertical e o giro de 180° no espelhado.

| Config | f3 |
|---|---|
| Mundo (w×h) | 3,2 × 3,2 |
| Profundidade | 1,0 (o dobro, para o 3D aparecer) |
| Face lateral | gradiente **dourado** (`0x6b5a00` → `0xfae30a`), no lugar do cinza do F1/F2 |
| Silhueta (normalizada) | `(-0,5;0,5) (0,5;0,5) (-0,5;-0,5)` (triângulo) |
| Stage desktop / mobile | 68×68 / 40×40 (metade do tamanho) |
| `enterAxis` | **`diag`** (entra e sai na diagonal) |
| `baseYaw` / `basePitch` | 0,24 / 0,10 (os mesmos do F1) |
| `slab` / `anchorShift` | 0,16 / **4px** (original) e **3px** (espelhado) |
| `anchor` (original / espelhado) | moldura, recuo **-7px / -6px** (canto do triângulo no canto da moldura) e moldura, recuo **-9px / -7px** (4px para fora do canto inferior-direito) |
| `floatScale` / `rotationScale` | 0,65 / 1 |
| `artFill` | 0,72 |
| Altura de referência | 68px |

**Perspectiva**: com o mesmo yaw/pitch do F1, a face da esquerda aparece
(≈3px de parede dourada, medidos em x=8‑10 com RGB 145,115,0) e o topo
praticamente não — a faixa escura na borda superior do render é a própria
antisserrilhamento da arte, não a parede (o pitch de -0,10 esconde a face de
cima). O F1 segue com a lateral cinza.

**Entrada/saída diagonal**: a animação sai **do meio da página para o canto** e
na saída **do canto para o meio**. Medido: o original sai com `translateX 0 →
+141px` e `translateY 0 → +141px` (desce para a direita, em direção ao centro
da tela) e o espelhado com `-141px` nos dois eixos (sobe para a esquerda).

Medições: stage de 68×68 (o F3 pela metade), silhueta 59‑63px (folga 2/2px),
flutuação vertical 2‑4px e horizontal 2px.

**Ancoragem**: todos os painéis se posicionam a partir de uma origem (a
**moldura do drawer** — a área onde a cortina termina de revelar o conteúdo —
ou a viewport) mais um recuo do canto, configurável por asset e por instância:

| | origem | recuo (original / espelhado) | onde fica |
|---|---|---|---|
| F1 | moldura | -29/-11 e -24/-11 | pendurado na borda do painel (x=355) e no canto da tela (direita em 1440) |
| F2 | moldura | -19/-11 e -14/-11 | igual ao F1, com 10px de recuo a mais |
| F3 | moldura | **-5/-4** e **-9/-5** | o canto do triângulo encosta no canto da moldura |

O F3 é a peça triangular, então o recuo compensa a margem que a perspectiva
deixa entre a arte e o canto do stage (5px à esquerda, 4px em cima, 5px à
direita e embaixo): o canto direito do triângulo fica no canto da moldura e o
inferior-direito 4px para fora dele, como pedido. Antes o F3 usava a viewport
como origem e o original saía do drawer (359px do canto da tela, contra 3px
do espelhado — impossível alinhar o par).

Medido no desktop 1440×900 (moldura em 384,144‑1416,876): o canto do
triângulo do original em (383,141) e o do espelhado em (1418,878). No mobile
390×844 o clamp mantém os dois dentro da tela.

### Menu da drawer com 5 itens

O stagger dos links do menu é por `:nth-of-type` no `src/css/global.css`. Com
o quinto item (Onde Comprar), o Blog ficou fora das regras e **parou de
animar** na abertura e no fechamento da drawer (delay 0 e sem o estado
inicial). As regras agora cobrem `:nth-of-type(1..5)`:

| | A Fibramfer | Produtos | Onde Comprar | Segurança | Blog | CTA Contato |
|---|---|---|---|---|---|---|
| Abertura (delay) | 500ms | 700ms | 900ms | 1100ms | 1200ms | 1300ms |
| Fechamento (delay) | 1500ms | 1300ms | 1100ms | 900ms | 700ms | 500ms |

A entrada segue "A Fibramfer primeiro e Contato por último" e o fechamento o
oposto ("Contato primeiro e A Fibramfer por último"), como os comentários do
CSS descrevem.

## Correções aplicadas

- `opacity: 1` em `.fibramfer-float-stage--open`: a classe base usava
  `opacity: 0` e nada o reabria — o F1 (canvas e fallback) ficava
  permanentemente transparente.
- `transition` com `var(--duration-500) var(--ease-out)` do DS, no lugar dos
  valores literais.
- Duração do reveal lida de `--drawer-reveal-gate-duration` (publicada pelo
  DS nas gates), com fallback de 1200ms.
- `positionRoot` só reescreve `top`/`left` quando o valor muda, evitando
  reflow em toda mutação do DOM.
- `left` com clamp em 0 para o F1 não sair da viewport no mobile.
- Flutuação ampliada: a levitação era de 0,02u (0,67px, imperceptível) e as
  rotações ficavam abaixo de 1px. Agora são 0,065u de levitação, 0,07rad de
  guinada, 0,018rad de inclinação, 0,015rad de balanço e 0,05u de deriva,
  com duas senoides incomensuráveis (5,7s e 10s) para não repetir.
- A levitação é limitada em runtime pela folga vertical real entre a arte e
  o canvas (`resolveBobLimit`), então nenhum viewport corta o F1.
- `motionScale` compensa o tamanho do canvas entre breakpoints
  (184px → 128px) para o movimento em pixels ficar equivalente.
- O PNG de fallback ganhou a animação `fibramfer-float`, desligada em
  `prefers-reduced-motion`.
- A variante espelhada saiu de um espelho só no eixo X (shape espelhado +
  textura com `repeat.x = -1`) para o **giro de 180° do painel inteiro**
  (grupo com `rotation.z = Math.PI`), que é a forma de referência
  (`public/assets/f1e.png`): corte da silhueta no topo-esquerdo e arte
  invertida. O fallback passou de `scaleX(-1)` para `rotate(180deg)`.
- O componente virou genérico: `FibramferF1Float.astro` → `FibramferFloat.astro`
  (classes `fibramfer-float-*`, dados `data-fibramfer-float-*`) e a arte/forma/
  tamanho passaram para a config por asset em `src/lib/floatAssets.ts`. O F2
  entrou no slot `produtos` com o mesmo par (original + espelhado).
- A câmera deixou de ser fixa: ela é calculada pela altura do painel e pelo
  `artFill` de cada asset, medindo a distância a partir da frente do painel
  (`depth/2` mais perto da câmera que o centro da extrusão).
- A entrada/saída deixou de ter eixo fixo: os `translate3d` viraram
  `--enter-x`/`--enter-y` e cada asset declara o seu (`enterAxis`), então o
  F2 desliza lateralmente (da direita para a esquerda e vice-versa) enquanto
  o F1 continua subindo e descendo. O bloco de movimento reduzido continua
  valendo sem ajustes, porque as regras de transform mantiveram a mesma
  especificidade.
- O painel espelhado recua 0,5rem quando o drawer fica rolável, como o
  botão fechar: a posição passou de `right`/`bottom` inline para as variáveis
  `--float-right`/`--float-bottom` (o inline venceria a regra da scrollbar).
- O yaw e o pitch base viraram por asset (`baseYaw`/`basePitch`): o F2 é
  paisagem e a mesma guinada do F1 o deformava demais (a diagonal caía para
  0,88), então o F2 ficou com 0,20/0,10 e o `artFill` para 0,76 — a arte
  maior e mais fiel ao PNG, sem perder a perspectiva que dá o 3D. O F1 não
  mudou.
- As rotações da flutuação deixaram de escalar com a altura do painel
  (`rotationScale`): o F2 é baixo e, escalando tudo pela altura, girava
  quase imperceptivelmente. Com `rotationScale: 0.9` o F2 gira como o F1
  (flutuação vertical de 3‑4px para 5‑6px).
- O F2 ganhou laje (`slab: 0,16`) — o shape é o recorte do PNG expandido e a
  face frontal da laje deixou de ser invisível, o que dá a aresta cinza de
  ~3,5px em volta da arte (o F1 segue com `slab: 0`, sem aresta). Junto, o
  `anchorShift: 10` recuou o F2 10px do canto em que está (topo-esquerda para
  a direita, baixo-direita para a esquerda) e o stage dele caiu 25%
  (208×96 → 156×72 no desktop, 128×80 → 96×60 no mobile).
- Nova página `/onde-comprar/` (rota de drawer como as outras, menu depois
  de Produtos) com o asset `f3` — a peça dourada quadrada, no mesmo modelo do
  F1: par original + espelhado, entrada **diagonal** (do meio da página para
  o canto, e na saída do canto para o meio) e giro de 180° no espelhado. O F3
  ficou com metade do tamanho (stage 68×68), o dobro da profundidade, a
  lateral dourada e a aresta da laje, para o 3D aparecer.
- Os painéis animados foram aplicados nas outras páginas, no mesmo padrão:
  **segurança** e **termos** com o F1, **blog** com o F2, **contato**,
  **privacidade** e o drawer do post (**blog-posts**) com o F3. Cada slot
  renderiza o par (original + espelhado) e nada mais foi preciso: o script do
  `FibramferFloat` já descobre as instâncias pelo atributo
  `data-fibramfer-float-root`. No drawer legal (privacidade/termos) a moldura
  é mais alta (inset de topo 1,5rem e base de ~6rem) e o painel espelhado
  termina acima dos links legais flutuantes (que ficam em y=827‑848), com
  13‑17px de folga.
- O item **Blog** do menu parou de animar na abertura e no fechamento da
  drawer: o stagger do `global.css` cobria só `:nth-of-type(1..4)` e, com o
  quinto item, o Blog ficava sem delay e sem o estado inicial. As regras
  passaram a cobrir `:nth-of-type(1..5)`, com a sequência de 5 itens + CTA
  mantida nos dois sentidos.
- A ancoragem virou config por asset (`anchor`: origem moldura/viewport +
  recuo do canto, por instância). O F3 estava com a origem na viewport, o que
  jogava o painel original para fora do drawer (359px do canto da tela contra
  3px do espelhado); agora os dois se posicionam a partir da moldura, com o
  canto do triângulo encostando nela.

