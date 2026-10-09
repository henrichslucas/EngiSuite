// Verificação de perfil I soldado/laminado de aço à flexão e cortante. ABNT NBR 8800:2008 (Anexo G simplificado).
// Unidades: cm, kN, MPa. Perfil duplamente simétrico, contido lateralmente salvo se informado Lb.
const E = 20000 // kN/cm²
const GA1 = 1.1

export function calcularPerfilI({ bf, tf, tw, h, fy, msk, vsk, lb = 0, gq = 1.4 }) {
  const v = { bf, tf, tw, h, fy, msk, vsk, lb }
  if (!Object.values(v).every(Number.isFinite)) return { ok: false, erro: 'Preencha todos os campos com números.' }
  if (bf <= 0 || tf <= 0 || tw <= 0 || h <= 2 * tf || fy <= 0 || tw > bf) return { ok: false, erro: 'Dimensões inválidas.' }
  const fyk = fy / 10 // kN/cm²
  const hw = h - 2 * tf
  const A = 2 * bf * tf + hw * tw
  const Ix = (bf * h ** 3 - (bf - tw) * hw ** 3) / 12
  const Iy = (2 * tf * bf ** 3 + hw * tw ** 3) / 12
  const Wx = Ix / (h / 2)
  const Zx = bf * tf * (h - tf) + (tw * hw * hw) / 4
  const ry = Math.sqrt(Iy / A)
  const lamF = bf / 2 / tf
  const lamW = hw / tw
  const sq = Math.sqrt(E / fyk)
  const compacta = lamF <= 0.38 * sq && lamW <= 3.76 * sq
  const semi = lamF <= 1.0 * sq * 0.69 && lamW <= 5.7 * sq // limites λr aproximados (laminado/soldado)
  const Mpl = Zx * fyk
  const Mrd = Math.min(compacta ? Mpl : Wx * fyk, 1.5 * Wx * fyk) / GA1
  const Lp = 1.76 * ry * sq
  const aw = h * tw
  const kv = 5
  const lamv = hw / tw
  const lp = 1.1 * Math.sqrt((kv * E) / fyk)
  const lr = 1.37 * Math.sqrt((kv * E) / fyk)
  const Vpl = 0.6 * aw * fyk
  const Vrd = (lamv <= lp ? Vpl : lamv <= lr ? (lp / lamv) * Vpl : 1.24 * (lp / lamv) ** 2 * Vpl) / GA1
  const Msd = gq * Math.abs(msk) * 100
  const Vsd = gq * Math.abs(vsk)
  const avisos = []
  if (!compacta) avisos.push(semi ? 'Seção não compacta (semicompacta): Mrd usa o limite elástico Wx·fy (aproximação conservadora, 8800 G.2).' : 'Seção esbelta: o Anexo F/G da NBR 8800 não é coberto aqui.')
  if (lb > Lp) avisos.push(`Lb > Lp (${Lp.toFixed(0)} cm): verifique flambagem lateral com torção (FLT) — Mrd mostrado vale para Lb ≤ Lp.`)
  if (Vsd > Vrd) avisos.push('Vsd > Vrd: reforce a alma ou use enrijecedores.')
  if (Msd > Mrd) avisos.push('Msd > Mrd.')
  return { ok: true, A, Ix, Iy, Wx, Zx, ry, lamF, lamW, compacta, Mrd: Mrd / 100, Msd: Msd / 100, Vrd, Vsd, Lp, utilM: Msd / Mrd, utilV: Vsd / Vrd, atende: Msd <= Mrd && Vsd <= Vrd && lb <= Lp, avisos }
}
