// Verificação ao esforço cortante, NBR 6118:2014 item 17.4.2.2 (Modelo I: θ = 45°, estribos verticais).
import { areaBarra, fctm } from './viga.js'

export const ESTRIBOS = [5, 6.3, 8, 10]

export function calcularCisalhamento({ bw, h, dl, fck, fywk, vsk, pernas = 2 }, { gf = 1.4, gc = 1.4, gs = 1.15 } = {}) {
  const v = { bw, h, dl, fck, fywk, vsk }
  if (!Object.values(v).every(Number.isFinite)) return { ok: false, erro: 'Preencha todos os campos com números.' }
  if (bw <= 0 || h <= 0 || dl <= 0 || dl >= h) return { ok: false, erro: "Dimensões inválidas (verifique bw, h e d')." }
  if (fck < 20 || fck > 90) return { ok: false, erro: 'fck deve estar entre 20 e 90 MPa.' }
  if (vsk < 0 || fywk <= 0) return { ok: false, erro: 'Valores devem ser positivos.' }

  const d = h - dl
  const vsd = gf * vsk
  const fcd = fck / 10 / gc // kN/cm²
  const av2 = 1 - fck / 250
  const vrd2 = 0.27 * av2 * fcd * bw * d
  const fctmM = fctm(fck)
  const fctd = (0.7 * fctmM) / 10 / gc
  const vc = 0.6 * fctd * bw * d
  const fywd = Math.min(fywk / 10 / gs, 43.5) // limitado a 435 MPa
  const vsw = Math.max(vsd - vc, 0)
  const aswCalc = vsw / (0.9 * d * fywd) // cm²/cm (todas as pernas)
  const aswMin = (0.2 * fctmM / fywk) * bw // cm²/cm
  const asw = Math.max(aswCalc, aswMin)
  const smax = vsd <= 0.67 * vrd2 ? Math.min(0.6 * d, 30) : Math.min(0.3 * d, 20)

  const avisos = []
  const ok = vsd <= vrd2
  if (!ok) avisos.push('Vsd > VRd2: esmagamento da biela comprimida. Aumente a seção ou o fck.')
  if (aswCalc < aswMin) avisos.push('Adotada a armadura transversal mínima (17.4.1.1.1).')

  const opcoes = ESTRIBOS.map((phi) => {
    const area = pernas * areaBarra(phi)
    const s = Math.min(Math.floor((area / asw) * 2) / 2, smax) // múltiplos de 0,5 cm
    return { phi, s, pernas }
  }).filter((o) => o.s >= 5)

  return { ok, d, vsd, vrd2, vc, vsw, aswCalc: aswCalc * 100, aswMin: aswMin * 100, asw: asw * 100, smax, opcoes, avisos }
}
