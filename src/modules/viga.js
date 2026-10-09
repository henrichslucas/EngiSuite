// Dimensionamento de viga de concreto armado à flexão simples (ELU), seção retangular.
// Referência: ABNT NBR 6118:2014, itens 8.2, 14.6.4.3, 17.2 e 17.3.5. Ferramenta de apoio: não substitui a verificação do projetista.
// Unidades: cm, kN, MPa nas entradas; cálculo interno em kN e cm.

export const ES = 21000 // kN/cm² (210 GPa)
export const BARRAS = [6.3, 8, 10, 12.5, 16, 20, 25, 32, 40]
export const areaBarra = (phi) => (Math.PI * (phi / 10) ** 2) / 4 // phi em mm -> cm²

export function parametrosConcreto(fck) {
  const alta = fck > 50
  return {
    lambda: alta ? 0.8 - (fck - 50) / 400 : 0.8,
    alphaC: alta ? 0.85 * (1 - (fck - 50) / 200) : 0.85,
    epsCu: alta ? 2.6 + 35 * ((90 - fck) / 100) ** 4 : 3.5, // ‰
    xiLim: alta ? 0.35 : 0.45
  }
}

export function fctkSup(fck) {
  const fctm = fck <= 50 ? 0.3 * fck ** (2 / 3) : 2.12 * Math.log(1 + 0.11 * fck)
  return 1.3 * fctm // MPa
}

function validar({ bw, h, dl, fck, fyk, msk }) {
  if (![bw, h, dl, fck, fyk, msk].every(Number.isFinite)) return 'Preencha todos os campos com números.'
  if (bw <= 0 || h <= 0) return 'Largura e altura devem ser positivas.'
  if (dl <= 0 || dl >= h / 2) return "O d' deve ser positivo e menor que metade da altura."
  if (fck < 20 || fck > 90) return 'fck deve estar entre 20 e 90 MPa (NBR 6118).'
  if (fyk <= 0) return 'fyk deve ser positivo.'
  if (msk < 0) return 'O momento deve ser positivo (use o módulo do momento).'
  return null
}

// Dimensiona para um momento de cálculo md (kN·cm). Devolve As e A's em cm².
function dimensionar({ bw, d, dl, fcd, fyd, md, par }) {
  const sigma = par.alphaC * fcd
  const kmd = md / (bw * d * d * sigma)
  if (kmd > 0.5) return { ok: false, erro: 'Seção insuficiente: aumente a altura ou a largura.' }
  const y = d * (1 - Math.sqrt(1 - 2 * kmd)) // y = λx
  const x = y / par.lambda
  const xi = x / d
  if (xi <= par.xiLim) {
    return { ok: true, dupla: false, kmd, x, xi, as: md / (fyd * (d - y / 2)), asl: 0 }
  }
  // armadura dupla: x fixado no limite de ductilidade
  const xl = par.xiLim * d
  if (dl >= xl) return { ok: false, erro: "d' maior que a linha neutra limite: aumente a seção." }
  const yl = par.lambda * xl
  const mlim = bw * yl * sigma * (d - yl / 2)
  const dm = md - mlim
  const epsL = (par.epsCu * (xl - dl)) / xl // ‰
  const sigL = Math.min((ES * epsL) / 1000, fyd)
  const asl = dm / ((d - dl) * sigL)
  const as = mlim / (fyd * (d - yl / 2)) + dm / ((d - dl) * fyd)
  return { ok: true, dupla: true, kmd, x: xl, xi: par.xiLim, as, asl, sigmaL: sigL }
}

export function calcularViga(entrada, { gf = 1.4, gc = 1.4, gs = 1.15 } = {}) {
  const erro = validar(entrada)
  if (erro) return { ok: false, erro }
  const { bw, h, dl, fck, fyk, msk } = entrada
  const d = h - dl
  const par = parametrosConcreto(fck)
  const fcd = fck / 10 / gc
  const fyd = fyk / 10 / gs
  const md = msk * 100 * gf

  const base = { d, fcd, fyd, md: md / 100, par }
  const r = dimensionar({ bw, d, dl, fcd, fyd, md, par })
  if (!r.ok) return { ...base, ...r }

  // armadura mínima: As,min dimensiona a seção para Md,min = 0,8 W0 fctk,sup, com piso de 0,15% Ac
  const ac = bw * h
  const w0 = (bw * h * h) / 6
  const mdMin = 0.8 * w0 * (fctkSup(fck) / 10)
  const rMin = dimensionar({ bw, d, dl, fcd, fyd, md: mdMin, par })
  const asMin = Math.max(rMin.ok ? rMin.as : 0, 0.0015 * ac)
  const asMax = 0.04 * ac - r.asl

  const as = Math.max(r.as, asMin)
  const avisos = []
  if (r.as < asMin) avisos.push('Adotada a armadura mínima (NBR 6118, 17.3.5.2.1).')
  if (r.dupla) avisos.push('Armadura dupla: x limitado a ' + par.xiLim.toFixed(2) + 'd para garantir ductilidade (NBR 6118, 14.6.4.3).')
  if (as + r.asl > 0.04 * ac) avisos.push('A soma das armaduras excede 4% de Ac (NBR 6118, 17.3.5.2.4): aumente a seção.')

  const opcoes = (area) =>
    area > 0 ? BARRAS.map((phi) => ({ phi, n: Math.max(2, Math.ceil(area / areaBarra(phi) - 1e-9)) })).map((o) => ({ ...o, area: o.n * areaBarra(o.phi) })) : []

  return {
    ...base,
    ok: true,
    dupla: r.dupla,
    kmd: r.kmd,
    x: r.x,
    xi: r.xi,
    as,
    asl: r.asl,
    asCalc: r.as,
    asMin,
    asMax,
    tracao: opcoes(as),
    compressao: opcoes(r.asl),
    avisos
  }
}
