export type FloatAssetKey = 'f1' | 'f2' | 'f3';

export type FloatAsset = {
  /** Textura (PNG com alpha) aplicada na frente do painel. */
  src: string;
  /** Medida do painel no mundo 3D. */
  width: number;
  height: number;
  /** Profundidade da extrusão (face lateral cinza). */
  depth: number;
  /** Cores da face lateral (de baixo para cima). */
  sideBottom: number;
  sideTop: number;
  /**
   * Silhueta em unidades normalizadas (-0.5..0.5) no sentido horário,
   * multiplicada por `width`/`height` para virar o shape do Three.js.
   * O recorte do PNG é o mesmo da silhueta: o `f1` tem o corte embaixo à
   * direita e o `f2` a diagonal de 45° à direita.
   */
  polygon: Array<[number, number]>;
  /**
   * Expansão do shape em relação ao recorte do PNG (unidades de mundo).
   * A base extrudada passa a ser um pouco maior que a arte, então a parede
   * cinza da extrusão aparece em volta dela — é o que dá o volume geométrico
   * da peça. `0` mantém a laje exatamente no recorte da arte.
   */
  slab: number;
  /**
   * Ancoragem do painel: de onde ele se posiciona e o quanto recua do canto.
   * `origin` é a moldura do drawer (onde a cortina termina de revelar o
   * conteúdo) ou a viewport; o recuo é positivo para dentro do canto.
   */
  anchor: {
    original: { origin: 'frame' | 'viewport'; x: number; y: number };
    mirror: { origin: 'frame' | 'viewport'; x: number; y: number };
  };
  /**
   * Eixo da entrada e da saída do painel: `y` sobe/desce (painel retrato),
   * `x` desliza da direita para a esquerda e vice-versa (painel paisagem) e
   * `diag` desliza na diagonal da peça (a hipotenusa do F3).
   */
  enterAxis: 'x' | 'y' | 'diag';
  /**
   * Giro base do painel no mundo. Um painel largo chega muito mais perto da
   * câmera na borda da frente, então a mesma guinada o deforma bem mais que
   * um painel retrato — por isso o F2 usa uma guinada menor.
   */
  baseYaw: number;
  basePitch: number;
  /** Escala da flutuação: proporcional à altura do painel. */
  floatScale: number;
  /**
   * Escala das rotações da flutuação (guinada, inclinação e balanço). Um
   * giro é um giro: o F2 é baixo e perderia o movimento se usasse a mesma
   * escala da altura, então ele gira quase como o F1.
   */
  rotationScale: number;
  /**
   * Fração da altura do canvas que a arte deve ocupar. Um painel largo sofre
   * muito mais com a perspectiva (a borda mais próxima da câmera cresce), então
   * o F2 é enquadrado mais folgado que o F1.
   */
  artFill: number;
  /** Altura de referência do canvas (px), para compensar o movimento entre breakpoints. */
  referenceHeight: number;
};

export const FLOAT_ASSETS: Record<FloatAssetKey, FloatAsset> = {
  //. F1: painel em retrato (97x306), o original do drawer A Fibramfer.
  f1: {
    src: '/assets/f1.png',
    width: 1.55,
    height: 4.9,
    depth: 0.62,
    sideBottom: 0x292929,
    sideTop: 0xb9b9b9,
    polygon: [
      [-0.5, 0.5],
      [0.5, 0.5],
      [0.5, -0.1837],
      [-0.5, -0.5],
    ],
    enterAxis: 'y',
    baseYaw: 0.24,
    basePitch: 0.1,
    slab: 0,
    anchor: {
      original: { origin: 'frame', x: -29, y: -11 },
      mirror: { origin: 'frame', x: -24, y: -11 },
    },
    floatScale: 1,
    rotationScale: 1,
    artFill: 0.9226,
    referenceHeight: 184,
  },
  //. F2: painel paisagem (211x97) com a diagonal de 45° à direita.
  f2: {
    src: '/assets/f2.png',
    width: 4.9,
    height: 2.253,
    depth: 0.62,
    sideBottom: 0x292929,
    sideTop: 0xb9b9b9,
    polygon: [
      [-0.5, 0.5],
      [0.5, 0.5],
      [0.0355, -0.5],
      [-0.5, -0.5],
    ],
    enterAxis: 'x',
    baseYaw: 0.2,
    basePitch: 0.1,
    slab: 0.16,
    anchor: {
      original: { origin: 'frame', x: -19, y: -11 },
      mirror: { origin: 'frame', x: -14, y: -11 },
    },
    floatScale: 0.46,
    rotationScale: 0.9,
    artFill: 0.68,
    referenceHeight: 84,
  },
  //. F3: peça quadrada dourada (71x71), a diagonal do topo-direito para o
  //  canto inferior-esquerdo. Entrada/saída na diagonal da peça.
  f3: {
    src: '/assets/f3.png',
    width: 3.2,
    height: 3.2,
    depth: 1,
    sideBottom: 0x6b5a00,
    sideTop: 0xfae30a,
    polygon: [
      [-0.5, 0.5],
      [0.5, 0.5],
      [-0.5, -0.5],
    ],
    enterAxis: 'diag',
    baseYaw: 0.24,
    basePitch: 0.1,
    slab: 0.16,
    anchor: {
      //. O canto direito do triângulo encosta no canto da moldura: o original
      //  fica no topo-esquerdo da página e o espelhado 4px para fora do
      //  canto inferior-direito. O recuo compensa a margem que a
      //  perspectiva deixa entre a arte e o canto do stage.
      original: { origin: 'frame', x: -7, y: -6 },
      mirror: { origin: 'frame', x: -9, y: -7 },
    },
    floatScale: 0.65,
    rotationScale: 1,
    artFill: 0.72,
    referenceHeight: 68,
  },
};

export const isFloatAssetKey = (value: string | undefined): value is FloatAssetKey =>
  value === 'f1' || value === 'f2' || value === 'f3';

/**
 * Expande um polígono convexo (no mundo) em `distance`: cada aresta é
 * deslocada para fora e o novo vértice é a interseção das arestas
 * deslocadas. O polígono precisa estar no sentido horário, que é como as
 * silhuetas dos assets são descritas.
 */
export const expandPolygon = (
  points: Array<[number, number]>,
  distance: number,
): Array<[number, number]> => {
  if (distance === 0) return points;

  const count = points.length;
  const lines = points.map((point, index) => {
    const next = points[(index + 1) % count];
    const ex = next[0] - point[0];
    const ey = next[1] - point[1];
    const length = Math.hypot(ex, ey) || 1;
    // Normal externa: no sentido horário, a exterior é à esquerda da aresta.
    const nx = -ey / length;
    const ny = ex / length;
    return {
      px: point[0] + nx * distance,
      py: point[1] + ny * distance,
      dx: ex / length,
      dy: ey / length,
    };
  });

  return lines.map((line, index) => {
    const previous = lines[(index - 1 + count) % count];
    const determinant = previous.dx * line.dy - previous.dy * line.dx;
    if (Math.abs(determinant) < 1e-9) return [line.px, line.py] as [number, number];
    const t =
      ((line.px - previous.px) * line.dy - (line.py - previous.py) * line.dx) / determinant;
    return [previous.px + previous.dx * t, previous.py + previous.dy * t] as [number, number];
  });
};
