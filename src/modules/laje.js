// Armadura de laje maciça por faixa de 1 m a partir do momento fletor por metro (kN·m/m).
import { calcularViga, areaBarra } from './viga.js'

export const BITOLAS_LAJE = [5, 6.3, 8, 10, 12.5]

export function calcularLaje({ h, dl, fck, fyk, mk }) {
  const r = calcularViga({ bw: 100, h, dl, fck, fyk, msk: mk })
  if (!r.ok) return r
  const smax = Math.min(2 * h, 20)
  const opcoes = BITOLAS_LAJE.map((phi) => {
    const s = Math.min(Math.floor((100 * areaBarra(phi) / r.as) * 2) / 2, smax)
    return { phi, s, area: (100 * areaBarra(phi)) / s }
  }).filter((o) => o.s >= 7)
  return { ...r, smax, opcoes }
}
