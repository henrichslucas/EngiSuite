// Ancoragem e emenda por traspasse de armaduras passivas, NBR 6118:2014 itens 9.3 e 9.4. Comprimentos em cm.
import { fctm } from './viga.js'

const ALFA_EMENDA = [[20, 1.2], [25, 1.4], [33, 1.6], [50, 1.8], [Infinity, 2.0]]

export function calcularAncoragem({ phi, fck, fyk, aderencia = 'boa', superficie = 'nervurada', gancho = false, asCalc = 1, asEf = 1, emendados = 50 }, { gc = 1.4, gs = 1.15 } = {}) {
  if (![phi, fck, fyk, asCalc, asEf, emendados].every(Number.isFinite) || phi <= 0 || asCalc <= 0 || asEf <= 0) return { ok: false, erro: 'Preencha todos os campos com números positivos.' }
  if (fck < 20 || fck > 90) return { ok: false, erro: 'fck deve estar entre 20 e 90 MPa.' }
  const f = phi / 10 // cm
  const eta1 = { nervurada: 2.25, entalhada: 1.4, lisa: 1.0 }[superficie]
  const eta2 = aderencia === 'boa' ? 1.0 : 0.7
  const eta3 = phi < 32 ? 1.0 : (132 - phi) / 100
  const fctd = (0.7 * fctm(fck)) / gc // MPa
  const fbd = eta1 * eta2 * eta3 * fctd
  const fyd = fyk / gs
  const lb = (f / 4) * (fyd / fbd)
  const alfa = gancho ? 0.7 : 1.0
  const lbMin = Math.max(0.3 * lb, 10 * f, 10)
  const lbNec = Math.max(alfa * lb * Math.min(asCalc / asEf, 1), lbMin)
  const a0t = ALFA_EMENDA.find(([lim]) => emendados <= lim)[1]
  const l0tMin = Math.max(0.3 * a0t * lb, 15 * f, 20)
  const l0t = Math.max(a0t * lbNec, l0tMin)
  return { ok: true, fbd, lb, lbNec, lbMin, a0t, l0t, l0tMin, eta1, eta2, eta3 }
}
