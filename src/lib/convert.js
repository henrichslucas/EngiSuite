// Conversão de unidades da função CONVERTER (subconjunto das unidades do Excel, mais kgf e tf, comuns na engenharia civil).
// Cada grupo tem uma unidade-base; p = aceita prefixos do SI (k, M, G, T, h, c, m, u, n, p).
const G = {
  comprimento: { base: 'm', u: { m: [1, true], mi: [1609.344], Nmi: [1852], in: [0.0254], ft: [0.3048], yd: [0.9144], ang: [1e-10], pica: [0.0042333333333] } },
  massa: { base: 'g', u: { g: [1, true], sg: [14593.9029], lbm: [453.59237], u: [1.66053906660e-24], ozm: [28.349523125] } },
  tempo: { base: 'sec', u: { yr: [31557600], day: [86400], hr: [3600], mn: [60], sec: [1, true], s: [1, true] } },
  pressao: { base: 'Pa', u: { Pa: [1, true], atm: [101325], mmHg: [133.322387415], Torr: [133.322368421], psi: [6894.757293168] } },
  forca: { base: 'N', u: { N: [1, true], dyn: [1e-5], lbf: [4.4482216152605], pond: [0.00980665], kgf: [9.80665], tf: [9806.65] } },
  energia: { base: 'J', u: { J: [1, true], e: [1e-7], c: [4.184], cal: [4.1868], eV: [1.602176634e-19], HPh: [2684519.537696172792], Wh: [3600, true], flb: [1.3558179483314004], BTU: [1055.05585262] } },
  potencia: { base: 'W', u: { W: [1, true], HP: [745.69987158227022], PS: [735.49875] } },
  area: { base: 'm2', u: { m2: [1], ha: [1e4], ar: [100], ft2: [0.09290304], in2: [6.4516e-4], yd2: [0.83612736], mi2: [2589988.110336], uk_acre: [4046.8564224], us_acre: [4046.8726098742514] } },
  volume: { base: 'm3', u: { m3: [1], l: [0.001, true], L: [0.001, true], lt: [0.001], ft3: [0.028316846592], in3: [1.6387064e-5], yd3: [0.764554857984], gal: [0.003785411784], qt: [9.46352946e-4] } },
  temperatura: { base: 'K', temp: true, u: { C: [1], cel: [1], F: [1], fah: [1], K: [1], kel: [1] } }
}
const PREF = { k: 1e3, M: 1e6, G: 1e9, T: 1e12, h: 1e2, c: 1e-2, m: 1e-3, u: 1e-6, n: 1e-9, p: 1e-12 }

function achar(nome) {
  for (const [g, def] of Object.entries(G)) if (nome in def.u) return { g, f: def.u[nome][0], nome }
  if (nome.length > 1 && nome[0] in PREF) {
    const resto = nome.slice(1)
    for (const [g, def] of Object.entries(G)) if (resto in def.u && def.u[resto][1]) return { g, f: def.u[resto][0] * PREF[nome[0]], nome: resto }
  }
  return null
}

const paraK = { C: (x) => x + 273.15, cel: (x) => x + 273.15, F: (x) => ((x - 32) * 5) / 9 + 273.15, fah: (x) => ((x - 32) * 5) / 9 + 273.15, K: (x) => x, kel: (x) => x }
const deK = { C: (x) => x - 273.15, cel: (x) => x - 273.15, F: (x) => ((x - 273.15) * 9) / 5 + 32, fah: (x) => ((x - 273.15) * 9) / 5 + 32, K: (x) => x, kel: (x) => x }

// devolve NaN quando as unidades não existem ou são de grupos diferentes
export function converterUnidade(valor, de, para) {
  const a = achar(de)
  const b = achar(para)
  if (!a || !b || a.g !== b.g) return NaN
  if (G[a.g].temp) return deK[b.nome](paraK[a.nome](valor))
  return (valor * a.f) / b.f
}
