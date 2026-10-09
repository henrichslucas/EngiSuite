// Propriedades geométricas de seções planas. Dimensões em cm; y medido a partir da base.

const ret = (b, h, y0) => ({ A: b * h, yc: y0 + h / 2, Ix: (b * h ** 3) / 12, Iy: (h * b ** 3) / 12 })
const circ = (D, yc, vazio = false) => ({ A: (vazio ? -1 : 1) * (Math.PI * D * D) / 4, yc, Ix: (vazio ? -1 : 1) * (Math.PI * D ** 4) / 64, Iy: (vazio ? -1 : 1) * (Math.PI * D ** 4) / 64 })
const neg = (p) => ({ A: -p.A, yc: p.yc, Ix: -p.Ix, Iy: -p.Iy })

export const FORMAS = {
  retangular: { nome: 'Retangular', campos: [['b', 'Largura b'], ['h', 'Altura h']] },
  circular: { nome: 'Circular', campos: [['D', 'Diâmetro D']] },
  tubo: { nome: 'Tubo circular', campos: [['D', 'Diâmetro externo D'], ['t', 'Espessura t']] },
  caixao: { nome: 'Caixão retangular', campos: [['b', 'Largura b'], ['h', 'Altura h'], ['t', 'Espessura t']] },
  T: { nome: 'Seção T', campos: [['bf', 'Largura mesa bf'], ['hf', 'Espessura mesa hf'], ['bw', 'Largura alma bw'], ['h', 'Altura total h']] },
  I: { nome: 'Perfil I', campos: [['bf', 'Largura mesa bf'], ['tf', 'Espessura mesa tf'], ['tw', 'Espessura alma tw'], ['h', 'Altura total h']] }
}

function partes(forma, p) {
  switch (forma) {
    case 'retangular':
      return { H: p.h, ps: [ret(p.b, p.h, 0)] }
    case 'circular':
      return { H: p.D, ps: [circ(p.D, p.D / 2)] }
    case 'tubo':
      return { H: p.D, ps: [circ(p.D, p.D / 2), neg(circ(p.D - 2 * p.t, p.D / 2))] }
    case 'caixao':
      return { H: p.h, ps: [ret(p.b, p.h, 0), neg(ret(p.b - 2 * p.t, p.h - 2 * p.t, p.t))] }
    case 'T':
      return { H: p.h, ps: [ret(p.bw, p.h - p.hf, 0), ret(p.bf, p.hf, p.h - p.hf)] }
    case 'I':
      return { H: p.h, ps: [ret(p.bf, p.tf, 0), ret(p.tw, p.h - 2 * p.tf, p.tf), ret(p.bf, p.tf, p.h - p.tf)] }
  }
}

export function propriedadesSecao(forma, p) {
  const def = FORMAS[forma]
  if (!def) return { ok: false, erro: 'Forma desconhecida.' }
  if (!def.campos.every(([k]) => Number.isFinite(p[k]) && p[k] > 0)) return { ok: false, erro: 'Informe todas as dimensões com valores positivos.' }
  if (forma === 'tubo' && 2 * p.t >= p.D) return { ok: false, erro: 'Espessura grande demais para o diâmetro.' }
  if (forma === 'caixao' && (2 * p.t >= p.b || 2 * p.t >= p.h)) return { ok: false, erro: 'Espessura grande demais para a seção.' }
  if (forma === 'T' && (p.hf >= p.h || p.bw > p.bf)) return { ok: false, erro: 'Verifique hf < h e bw ≤ bf.' }
  if (forma === 'I' && (2 * p.tf >= p.h || p.tw > p.bf)) return { ok: false, erro: 'Verifique 2·tf < h e tw ≤ bf.' }

  const { H, ps } = partes(forma, p)
  const A = ps.reduce((s, q) => s + q.A, 0)
  const yg = ps.reduce((s, q) => s + q.A * q.yc, 0) / A
  const Ix = ps.reduce((s, q) => s + q.Ix + q.A * (q.yc - yg) ** 2, 0)
  const Iy = ps.reduce((s, q) => s + q.Iy, 0)
  const yInf = yg
  const ySup = H - yg
  return { ok: true, A, yg, ySup, Ix, Iy, WxInf: Ix / yInf, WxSup: Ix / ySup, rx: Math.sqrt(Ix / A), ry: Math.sqrt(Iy / A) }
}
