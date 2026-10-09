// Sapata isolada retangular: tensões no solo, excentricidade, tombamento e altura mínima para sapata rígida.
// Momento aplicado em torno do eixo paralelo a B (excentricidade na direção de L). Unidades: m, kN, kPa.
export function calcularSapata({ N, M = 0, L, B, sigAdm, pp = 10, lp = 0.2 }) {
  if (![N, M, L, B, sigAdm, pp, lp].every(Number.isFinite) || N <= 0 || L <= 0 || B <= 0 || sigAdm <= 0) return { ok: false, erro: 'Preencha os campos com valores positivos.' }
  const Nt = N * (1 + pp / 100)
  const e = Math.abs(M) / Nt
  const area = L * B
  const med = Nt / area
  let sMax, sMin, comprimida
  if (e <= L / 6) {
    sMax = med * (1 + (6 * e) / L)
    sMin = med * (1 - (6 * e) / L)
    comprimida = L
  } else if (e < L / 2) {
    comprimida = 3 * (L / 2 - e)
    sMax = (2 * Nt) / (B * comprimida)
    sMin = 0
  } else return { ok: false, erro: 'Excentricidade fora da base: a sapata tomba.' }
  const fsTomb = e > 0 ? L / 2 / e : Infinity
  const areaMin = Nt / sigAdm
  const hMin = Math.max((L - lp) / 3, (B - lp) / 3) // 22.6.1: sapata rígida se h ≥ (a − ap)/3
  const avisos = []
  if (med > sigAdm) avisos.push('Tensão média acima da admissível.')
  if (sMax > 1.3 * sigAdm) avisos.push('Tensão máxima acima de 1,3 σadm.')
  if (e > L / 6) avisos.push('Excentricidade fora do núcleo central: parte da base descomprimida.')
  if (fsTomb < 1.5) avisos.push('Segurança ao tombamento inferior a 1,5.')
  return { ok: true, Nt, e, med, sMax, sMin, comprimida, fsTomb, areaMin, ladoQuadrado: Math.ceil(Math.sqrt(areaMin) * 20) / 20, hMin, atende: avisos.length === 0, avisos }
}
