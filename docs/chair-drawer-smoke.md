# Verificação da cadeira nos drawers

## Preparação

```sh
npx astro check
npm run build
npm run preview -- --port 4321
```

Abra `http://localhost:4321/`. Execute em desktop e celular, com animações
habilitadas e depois com a preferência de movimento reduzido.

## Fluxo esperado

1. Na home, aguarde o desenho dos paths e role para revelar parte da cadeira
   colorida. Anote `window.scrollY` no console.
2. Abra Produtos pelo header ou menu mobile. A cadeira deve ficar oculta, sem
   mudar as dimensões de `.home-true-hero-media`, e suas animações devem parar.
3. Troque de drawer e visite Privacidade e Termos. A cadeira permanece oculta.
4. Feche pelo logo Home ou pelo X. A cadeira só reaparece quando o painel sai
   do DOM, com todos os paths no estado inicial e a máscara colorida em zero.
5. Aguarde o desenho terminar sem rolar: a cadeira permanece em traços. O
   `window.scrollY` deve continuar igual ao valor anotado, sem retorno ao topo.
6. Role novamente para baixo: a revelação colorida começa a partir de zero.
7. Repita fechando no fim do scroll. Após o redesenho, suba um pouco e desça:
   a revelação deve funcionar sem um salto para o progresso antigo.
8. Reabra enquanto o painel fecha e enquanto a cadeira desenha. A cadeira
   deve permanecer oculta/parada sob o painel; o próximo fechamento reinicia
   um único desenho, sem animações antigas concorrentes.
9. Confira voltar/avançar, redimensionamento e F5 com drawer aberto. Logo,
   menu fixo, H1, CTAs e rodapé mantêm seu comportamento anterior.
   No histórico, confira a posição salva da entrada de destino: o navegador
   pode restaurar posições diferentes após redimensionar uma dessas entradas.
   O replay não deve voltar a página ao topo nem provocar desvios posteriores.
10. Na home, role até a metade da revelação e use F5. A página deve voltar ao
    topo, a máscara colorida deve retornar a `0%` e a badge deve ficar na altura
    recolhida. Depois de rolar novamente, a timeline deve avançar desde o
    início.

Com movimento reduzido, a cadeira continua oculta sob o drawer e retorna
diretamente ao estado final acessível, sem desenho sequencial dos paths.

## Validação de reload — 2026-10-19

- Antes do F5: `scrollY=554`, progresso GSAP `0,5` e máscara em `59%`.
- Depois do F5: `scrollY=0`, progresso `0`, máscara em `0%`, badge recolhida e
  `history.scrollRestoration='auto'` restaurado.
- Nova descida até a mesma posição: progresso voltou a `0,5` a partir do
  início, sem recuperar o estágio anterior.

## Cobertura e limite existente

Os drawers principais, legais e o post aberto a partir da home compartilham
esse ciclo. O acesso direto/F5 em `/blog/welcome/` já usa `HomeScene` sem
`home` e não renderiza a cadeira; esse comportamento não foi alterado.

Os testes automatizados desta alteração usaram Chromium headless, estilos
computados e amostras por frame de todos os 118 paths. As fontes externas
foram bloqueadas nessa suíte; repita a inspeção visual com as fontes reais.
