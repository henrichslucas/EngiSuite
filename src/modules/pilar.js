// Pilar retangular: esbeltez (NBR 6118, 15.8) e capacidade à compressão centrada (verificação preliminar).
export function calcularPilar({ b, h, le, fck, fyk, as, nk, e1h = 0.5, ma = 1, mb = 1 }, { gf = 1.4, gc = 1.4, gs = 1.15 } = {}) {
  if (![b, h, le, fck, fyk, as, nk, e1h].every(Number.isFinite) || b <= 0 || h <= 0 || le <= 0 || as < 0 || nk < 0) return { ok: false, erro: 'Preencha todos os campos com números válidos.' }
  if (fck < 20 || fck > 90) return { ok: false, erro: 'fck deve estar entre 20 e 90 MPa.' }
  const ac = b * h
  const hmin = Math.min(b, h)
  const lam = (le * Math.sqrt(12)) / hmin // λ = le/i, i = h/√12 na direção de menor dimensão
  const alfaB = Math.max(0.6 + 0.4 * (mb / (ma || 1)), 0.4)
  const lam1 = Math.min(Math.max((25 + 12.5 * e1h) / alfaB, 35), 90)
  const fcd = fck / 10 / gc
  const fyd = fyk / 10 / gs
  const nd = gf * nk
  const sigS = Math.min(0.002 * 21000, fyd)
  const nrd = 0.85 * fcd * ac + as * sigS // compressão centrada, sem 2ª ordem
  const asMin = Math.max((0.15 * nd) / fyd, 0.004 * ac)
  const asMax = 0.08 * ac
  const classe = lam <= lam1 ? 'Curto (dispensa efeitos de 2ª ordem)' : lam <= 90 ? 'Medianamente esbelto (pilar-padrão com curvatura aproximada)' : lam <= 140 ? 'Esbelto (pilar-padrão acoplado a diagramas M, N, 1/r)' : lam <= 200 ? 'Muito esbelto (análise não linear rigorosa)' : 'Acima do limite da norma (λ > 200)'
  const avisos = []
  if (as < asMin) avisos.push('As abaixo do mínimo (17.3.5.3.1): ' + asMin.toFixed(2) + ' cm².')
  if (as > asMax) avisos.push('As acima do máximo de 8% de Ac (17.3.5.3.2).')
  if (hmin < 19) avisos.push('Menor dimensão < 19 cm: exige majoração de esforços (13.2.3).')
  if (lam > lam1) avisos.push('Pilar não é curto: a capacidade abaixo não considera 2ª ordem.')
  return { ok: true, ac, lam, lam1, classe, nd, nrd, folga: nrd / nd, atende: nrd >= nd, asMin, asMax, avisos }
}
