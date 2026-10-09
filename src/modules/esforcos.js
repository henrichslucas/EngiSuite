// Esforços (V, M) e flecha elástica em vigas isostáticas: biapoiada e em balanço (engastada em x = 0).
// Unidades: m, kN, kN/m, kN·m; EI em kN·m².

export const eiKnm2 = (eGPa, iCm4) => eGPa * iCm4 * 1e-2

export function calcularEsforcos({ tipo, L, q = 0, cargas = [], EI = 0, limite = 250 }) {
  if (!(L > 0)) return { ok: false, erro: 'O vão deve ser positivo.' }
  const P = cargas.filter((c) => c.P !== 0 && Number.isFinite(c.P))
  if (P.some((c) => !Number.isFinite(c.a) || c.a < 0 || c.a > L)) return { ok: false, erro: 'A posição das cargas pontuais deve estar entre 0 e L.' }
  if (!Number.isFinite(q)) return { ok: false, erro: 'Carga distribuída inválida.' }

  const simples = tipo === 'biapoiada'
  const soma = q * L + P.reduce((s, c) => s + c.P, 0)
  const mom0 = (q * L * L) / 2 + P.reduce((s, c) => s + c.P * c.a, 0) // momento em relação a x = 0
  const RA = simples ? soma - mom0 / L : soma
  const RB = simples ? mom0 / L : 0
  const MA = simples ? 0 : -mom0

  const apos = (a, x, side) => (side > 0 ? x >= a : x > a)
  const V = (x, side) => {
    if (simples) return RA - q * x - P.reduce((s, c) => s + (apos(c.a, x, side) ? c.P : 0), 0)
    return q * (L - x) + P.reduce((s, c) => s + (c.a > x || (side < 0 && c.a === x) ? c.P : 0), 0)
  }
  const M = (x) => {
    if (simples) return RA * x - (q * x * x) / 2 - P.reduce((s, c) => s + (x > c.a ? c.P * (x - c.a) : 0), 0)
    return -((q * (L - x) ** 2) / 2 + P.reduce((s, c) => s + (c.a > x ? c.P * (c.a - x) : 0), 0))
  }
  const y = (x) => {
    if (!(EI > 0)) return 0
    if (simples) {
      let s = (q * x * (L ** 3 - 2 * L * x * x + x ** 3)) / (24 * EI)
      for (const c of P) {
        const [xx, a] = x <= c.a ? [x, c.a] : [L - x, L - c.a]
        const b = L - a
        s += (c.P * b * xx * (L * L - b * b - xx * xx)) / (6 * EI * L)
      }
      return s
    }
    let s = (q * x * x * (6 * L * L - 4 * L * x + x * x)) / (24 * EI)
    for (const c of P) s += x <= c.a ? (c.P * x * x * (3 * c.a - x)) / (6 * EI) : (c.P * c.a * c.a * (3 * x - c.a)) / (6 * EI)
    return s
  }

  const N = 200
  const pts = []
  for (let i = 0; i <= N; i++) pts.push({ x: (L * i) / N, side: 1 })
  for (const c of P) {
    pts.push({ x: c.a, side: -1 }, { x: c.a, side: 1 })
  }
  pts.sort((a, b) => a.x - b.x || a.side - b.side)
  const curva = pts.map(({ x, side }) => ({ x, v: V(x, side), m: M(x), y: y(x) }))

  const maxBy = (f) => curva.reduce((best, p) => (Math.abs(f(p)) > Math.abs(f(best)) ? p : best), curva[0])
  const pv = maxBy((p) => p.v)
  const pm = maxBy((p) => p.m)
  const py = maxBy((p) => p.y)
  const flecha = Math.abs(py.y) // m
  const flechaLim = L / limite
  return {
    ok: true,
    RA,
    RB,
    MA,
    vmax: Math.abs(pv.v),
    xv: pv.x,
    mmax: Math.abs(pm.m),
    mSinal: pm.m,
    xm: pm.x,
    flecha: EI > 0 ? flecha : null,
    xf: py.x,
    flechaLim,
    flechaOk: EI > 0 ? flecha <= flechaLim : null,
    curva
  }
}
