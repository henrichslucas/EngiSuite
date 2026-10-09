// Flecha imediata (Branson) e diferida de viga retangular de concreto armado. NBR 6118:2014, 17.3.2.
// Unidades: cm, kN, MPa nas entradas. Vão e cargas: L (m), q (kN/m) ou P (kN).
import { fctm } from './viga.js'

export const ESQUEMAS = {
  biapoiada_q: { nome: 'Biapoiada, carga uniforme', kd: 5 / 384, kM: 1 / 8, pontual: false },
  balanco_q: { nome: 'Em balanço, carga uniforme', kd: 1 / 8, kM: 1 / 2, pontual: false },
  biapoiada_P: { nome: 'Biapoiada, carga pontual central', kd: 1 / 48, kM: 1 / 4, pontual: true }
}

export const Ecs = (fck) => {
  const ai = Math.min(0.8 + (0.2 * fck) / 80, 1)
  return ai * 5600 * Math.sqrt(fck) // MPa
}

export const xi = (meses) => (meses > 70 ? 2 : 0.68 * 0.996 ** meses * meses ** 0.32)

export function calcularFlecha({ esquema, L, carga, bw, h, dl, as, asl = 0, fck, t = 70, t0 = 1, limite = 250 }) {
  const e = ESQUEMAS[esquema]
  const v = { L, carga, bw, h, dl, as, asl, fck, t, t0, limite }
  if (!e || !Object.values(v).every(Number.isFinite)) return { ok: false, erro: 'Preencha todos os campos com números.' }
  if (L <= 0 || bw <= 0 || h <= 0 || as <= 0 || carga < 0 || dl <= 0 || dl >= h) return { ok: false, erro: 'Valores inválidos: verifique vão, seção, armadura e cobrimento.' }
  const d = h - dl
  const ec = Ecs(fck) / 10 // kN/cm²
  const es = 21000
  const ae = es / ec
  const Ic = (bw * h ** 3) / 12
  const fct = fctm(fck) / 10
  const Mr = (1.5 * fct * Ic) / (h / 2) // kN·cm
  const Lc = L * 100
  const Ma = e.pontual ? (carga * Lc) / 4 : e.kM * (carga / 100) * Lc * Lc // kN·cm
  // linha neutra no estádio II
  const A = bw / 2
  const B = ae * as + (ae - 1) * asl
  const C = -(ae * as * d + (ae - 1) * asl * dl)
  const x2 = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A)
  const III = (bw * x2 ** 3) / 3 + ae * as * (d - x2) ** 2 + (ae - 1) * asl * (x2 - dl) ** 2
  const r = Ma > 0 ? Math.min(Mr / Ma, 1) : 1
  const Ieq = Math.min(r ** 3 * Ic + (1 - r ** 3) * III, Ic)
  const fissurada = Ma > Mr
  const EI = ec * Ieq
  const di = e.pontual ? (e.kd * carga * Lc ** 3) / EI : (e.kd * (carga / 100) * Lc ** 4) / EI // cm
  const rho = asl / (bw * d)
  const dxi = xi(t) - xi(t0)
  const af = dxi / (1 + 50 * rho)
  const dt = di * (1 + af)
  const lim = Lc / limite
  const avisos = []
  if (dt > lim) avisos.push(`Flecha total acima do limite L/${limite}.`)
  if (!fissurada) avisos.push('Seção não fissurada para este momento (Ma ≤ Mr): Ieq = Ic.')
  return { ok: true, Ecs: Ecs(fck), Ic, III, Ieq, Mr: Mr / 100, Ma: Ma / 100, fissurada, x2, di: di * 10, af, dt: dt * 10, lim: lim * 10, atende: dt <= lim, avisos }
}
