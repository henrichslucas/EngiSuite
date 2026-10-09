// Flexo-compressão normal em pilar retangular com armadura simétrica nas duas faces (diagrama N-M por compatibilidade de deformações).
// NBR 6118:2014, 17.2. Unidades: cm, kN. Compressão positiva. Sem efeitos de 2ª ordem.

const ES = 21000

export function diagramaNM({ b, h, dl, as, fck, fyk }, { gc = 1.4, gs = 1.15 } = {}) {
  const alta = fck > 50
  const lam = alta ? 0.8 - (fck - 50) / 400 : 0.8
  const ac = alta ? 0.85 * (1 - (fck - 50) / 200) : 0.85
  const ecu = (alta ? 2.6 + 35 * ((90 - fck) / 100) ** 4 : 3.5) / 1000
  const ec2 = (alta ? 2 + 0.085 * (fck - 50) ** 0.53 : 2) / 1000
  const fcd = fck / 10 / gc
  const fyd = fyk / 10 / gs
  const camadas = [
    { y: dl, a: as / 2 },
    { y: h - dl, a: as / 2 }
  ]
  const linha = (x) => {
    // deformação na fibra superior; para x > h a reta gira em torno do ponto a (1 − εc2/εcu)·h do topo, onde ε = εc2
    const et = x <= h ? ecu : ec2 / (1 - ((1 - ec2 / ecu) * h) / x)
    const a = Math.min(lam * x, h)
    const Rc = ac * fcd * b * a
    let N = Rc
    let M = Rc * (h / 2 - a / 2)
    for (const c of camadas) {
      const eps = et * (1 - c.y / x)
      const sig = Math.max(-fyd, Math.min(fyd, ES * eps))
      const F = c.a * sig
      N += F
      M += F * (h / 2 - c.y)
    }
    return { N, M }
  }
  const pts = [{ N: -as * fyd, M: 0 }] // tração pura
  const xs = []
  for (let i = 1; i <= 400; i++) xs.push((h * i) / 200) // 0 a 2h
  for (let k = 2; k <= 16; k++) xs.push(h * 2 ** k) // x muito grande: compressão uniforme
  for (const x of xs) pts.push(linha(x))
  return pts // N crescente
}

export function calcularFlexoCompressao({ b, h, dl, as, fck, fyk, nk, mk }, par = {}) {
  const v = { b, h, dl, as, fck, fyk, nk, mk }
  if (!Object.values(v).every(Number.isFinite)) return { ok: false, erro: 'Preencha todos os campos com números.' }
  if (b <= 0 || h <= 0 || as <= 0 || dl <= 0 || dl >= h / 2 || nk < 0) return { ok: false, erro: 'Valores inválidos: verifique seção, armadura e cobrimento.' }
  if (fck < 20 || fck > 90) return { ok: false, erro: 'fck deve estar entre 20 e 90 MPa.' }
  const { gf = 1.4 } = par
  const nd = gf * nk
  const m1min = nd * (1.5 + 0.03 * h) // kN·cm
  const md = Math.max(gf * Math.abs(mk) * 100, m1min)
  const pts = diagramaNM({ b, h, dl, as, fck, fyk }, par)
  const nmax = pts[pts.length - 1].N
  if (nd > nmax) return { ok: false, erro: `Nd excede a capacidade à compressão centrada (${(nmax).toFixed(0)} kN).`, nmax }
  let mrd = 0
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1]
    const q = pts[i]
    if (nd >= p.N && nd <= q.N) {
      const t = q.N === p.N ? 0 : (nd - p.N) / (q.N - p.N)
      mrd = Math.max(mrd, p.M + t * (q.M - p.M))
    }
  }
  const avisos = []
  if (md > gf * Math.abs(mk) * 100) avisos.push('Governa o momento mínimo de 1ª ordem (11.3.3.4.3).')
  if (md > mrd) avisos.push('Md > MRd: aumente a seção ou a armadura.')
  const ac = b * h
  const rho = as / ac
  if (rho < 0.004) avisos.push('Taxa de armadura abaixo de 0,4%.')
  if (rho > 0.08) avisos.push('Taxa de armadura acima de 8%.')
  avisos.push('Efeitos de 2ª ordem não considerados: válido apenas para pilar curto.')
  return { ok: true, nd, md: md / 100, mrd: mrd / 100, atende: md <= mrd, folga: mrd > 0 ? mrd / md : 0, nmax, rho, avisos, curva: pts.map((p) => ({ N: p.N, M: p.M / 100 })) }
}
