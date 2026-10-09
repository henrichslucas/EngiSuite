// Conversão de unidades de uso corrente em engenharia estrutural. Cada grandeza tem uma unidade-base.
export const GRANDEZAS = {
  Força: { base: 'N', un: { N: 1, kN: 1e3, MN: 1e6, kgf: 9.80665, tf: 9806.65, lbf: 4.4482216 } },
  Pressão: { base: 'Pa', un: { Pa: 1, kPa: 1e3, MPa: 1e6, 'kgf/cm²': 98066.5, 'tf/m²': 9806.65, psi: 6894.7573 } },
  Comprimento: { base: 'm', un: { mm: 1e-3, cm: 1e-2, m: 1, km: 1e3, pol: 0.0254, pé: 0.3048 } },
  Momento: { base: 'N·m', un: { 'N·m': 1, 'kN·m': 1e3, 'kgf·m': 9.80665, 'kgf·cm': 0.0980665, 'tf·m': 9806.65, 'kN·cm': 10 } },
  Área: { base: 'm²', un: { 'mm²': 1e-6, 'cm²': 1e-4, 'm²': 1, 'pol²': 6.4516e-4 } },
  'Carga linear': { base: 'N/m', un: { 'N/m': 1, 'kN/m': 1e3, 'kgf/m': 9.80665, 'tf/m': 9806.65 } },
  'Peso específico': { base: 'N/m³', un: { 'N/m³': 1, 'kN/m³': 1e3, 'kgf/m³': 9.80665, 'tf/m³': 9806.65 } }
}

export function converter(grandeza, valor, de, para) {
  const g = GRANDEZAS[grandeza]
  if (!g || !(de in g.un) || !(para in g.un) || !Number.isFinite(valor)) return NaN
  return (valor * g.un[de]) / g.un[para]
}
