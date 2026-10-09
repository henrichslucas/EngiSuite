import { describe, expect, it } from 'vitest'
import { calcularCisalhamento } from '../src/modules/cisalhamento.js'
import { calcularEsforcos, eiKnm2 } from '../src/modules/esforcos.js'
import { propriedadesSecao } from '../src/modules/secao.js'
import { calcularAncoragem } from '../src/modules/ancoragem.js'
import { calcularLaje } from '../src/modules/laje.js'
import { calcularPilar } from '../src/modules/pilar.js'
import { calcularSapata } from '../src/modules/sapata.js'
import { converter } from '../src/modules/unidades.js'

describe('cisalhamento', () => {
  const e = { bw: 20, h: 50, dl: 4, fck: 25, fywk: 500, vsk: 100 }
  it('Modelo I, conferido à mão', () => {
    const r = calcularCisalhamento(e)
    expect(r.ok).toBe(true)
    expect(r.vsd).toBeCloseTo(140, 6)
    expect(r.vrd2).toBeCloseTo(399.2, 0)
    expect(r.vc).toBeCloseTo(70.8, 0)
    expect(r.asw).toBeCloseTo(3.84, 1) // cm²/m
    expect(r.aswMin).toBeCloseTo(2.05, 1)
    expect(r.smax).toBeCloseTo(27.6, 1)
    const o = r.opcoes.find((x) => x.phi === 6.3)
    expect(o.s * (o.pernas * 0.3117)).toBeGreaterThan(0) // existe
    expect((2 * Math.PI * 0.315 ** 2) / (o.s / 100)).toBeGreaterThanOrEqual(r.asw - 0.01)
  })
  it('detecta esmagamento da biela e entradas inválidas', () => {
    expect(calcularCisalhamento({ ...e, vsk: 400 }).ok).toBe(false)
    expect(calcularCisalhamento({ ...e, fck: NaN }).ok).toBe(false)
  })
  it('usa mínima quando Vsd ≤ Vc', () => {
    const r = calcularCisalhamento({ ...e, vsk: 10 })
    expect(r.asw).toBeCloseTo(r.aswMin, 6)
  })
})

describe('esforços', () => {
  it('biapoiada com carga uniforme', () => {
    const r = calcularEsforcos({ tipo: 'biapoiada', L: 6, q: 10, EI: 10000 })
    expect(r.RA).toBeCloseTo(30, 6)
    expect(r.RB).toBeCloseTo(30, 6)
    expect(r.mmax).toBeCloseTo(45, 6)
    expect(r.vmax).toBeCloseTo(30, 6)
    expect(r.flecha).toBeCloseTo(0.016875, 6)
  })
  it('biapoiada com carga pontual fora do centro', () => {
    const r = calcularEsforcos({ tipo: 'biapoiada', L: 10, cargas: [{ P: 100, a: 3 }] })
    expect(r.RA).toBeCloseTo(70, 6)
    expect(r.RB).toBeCloseTo(30, 6)
    expect(r.mmax).toBeCloseTo(210, 6)
    expect(r.xm).toBeCloseTo(3, 6)
    expect(r.vmax).toBeCloseTo(70, 6)
  })
  it('balanço com carga na ponta', () => {
    const r = calcularEsforcos({ tipo: 'balanco', L: 2, cargas: [{ P: 10, a: 2 }], EI: 10000 })
    expect(r.MA).toBeCloseTo(-20, 6)
    expect(r.mmax).toBeCloseTo(20, 6)
    expect(r.mSinal).toBeLessThan(0)
    expect(r.flecha).toBeCloseTo(80 / 30000, 6)
    expect(r.flechaOk).toBe(true)
  })
  it('flecha por superposição concorda com a fórmula (carga central)', () => {
    const r = calcularEsforcos({ tipo: 'biapoiada', L: 4, cargas: [{ P: 50, a: 2 }], EI: 20000 })
    expect(r.flecha).toBeCloseTo((50 * 64) / (48 * 20000), 6)
  })
  it('rigidez e validação', () => {
    expect(eiKnm2(210, 10000)).toBeCloseTo(21000, 6)
    expect(calcularEsforcos({ tipo: 'biapoiada', L: 0 }).ok).toBe(false)
    expect(calcularEsforcos({ tipo: 'biapoiada', L: 5, cargas: [{ P: 1, a: 9 }] }).ok).toBe(false)
  })
})

describe('seção', () => {
  it('retangular', () => {
    const r = propriedadesSecao('retangular', { b: 20, h: 50 })
    expect(r.A).toBe(1000)
    expect(r.yg).toBe(25)
    expect(r.Ix).toBeCloseTo(208333.33, 1)
    expect(r.WxInf).toBeCloseTo(8333.33, 1)
  })
  it('circular e tubo', () => {
    expect(propriedadesSecao('circular', { D: 10 }).Ix).toBeCloseTo((Math.PI * 1e4) / 64, 6)
    const t = propriedadesSecao('tubo', { D: 10, t: 1 })
    expect(t.Ix).toBeCloseTo((Math.PI * (1e4 - 8 ** 4)) / 64, 6)
  })
  it('T: centroide e inércia', () => {
    const r = propriedadesSecao('T', { bf: 60, hf: 10, bw: 20, h: 50 })
    expect(r.A).toBe(1400)
    expect(r.yg).toBeCloseTo(30.714, 2)
    const Ix = (20 * 40 ** 3) / 12 + 800 * (20 - r.yg) ** 2 + (60 * 10 ** 3) / 12 + 600 * (45 - r.yg) ** 2
    expect(r.Ix).toBeCloseTo(Ix, 4)
  })
  it('I simétrico tem centroide a meia altura', () => {
    expect(propriedadesSecao('I', { bf: 10, tf: 1, tw: 0.6, h: 20 }).yg).toBeCloseTo(10, 9)
  })
  it('valida', () => {
    expect(propriedadesSecao('tubo', { D: 10, t: 6 }).ok).toBe(false)
    expect(propriedadesSecao('retangular', { b: 0, h: 5 }).ok).toBe(false)
  })
})

describe('ancoragem', () => {
  it('lb para Ø16, C25, CA-50, boa aderência', () => {
    const r = calcularAncoragem({ phi: 16, fck: 25, fyk: 500 })
    expect(r.fbd).toBeCloseTo(2.886, 2)
    expect(r.lb).toBeCloseTo(60.3, 0)
    expect(r.lbNec).toBeCloseTo(60.3, 0)
  })
  it('gancho, má aderência e As,calc/As,ef', () => {
    const boa = calcularAncoragem({ phi: 16, fck: 25, fyk: 500 })
    expect(calcularAncoragem({ phi: 16, fck: 25, fyk: 500, aderencia: 'ma' }).lb).toBeCloseTo(boa.lb / 0.7, 6)
    expect(calcularAncoragem({ phi: 16, fck: 25, fyk: 500, gancho: true }).lbNec).toBeCloseTo(0.7 * boa.lb, 6)
    expect(calcularAncoragem({ phi: 16, fck: 25, fyk: 500, asCalc: 5, asEf: 10 }).lbNec).toBeCloseTo(boa.lb / 2, 6)
  })
  it('emenda por traspasse', () => {
    const r = calcularAncoragem({ phi: 16, fck: 25, fyk: 500, emendados: 100 })
    expect(r.a0t).toBe(2)
    expect(r.l0t).toBeCloseTo(2 * r.lbNec, 6)
    expect(calcularAncoragem({ phi: 16, fck: 25, fyk: 500, emendados: 20 }).a0t).toBe(1.2)
  })
})

describe('laje', () => {
  it('As por metro e espaçamentos', () => {
    const r = calcularLaje({ h: 12, dl: 2.5, fck: 25, fyk: 500, mk: 8 })
    expect(r.ok).toBe(true)
    expect(r.as).toBeGreaterThan(2)
    expect(r.smax).toBe(20)
    for (const o of r.opcoes) expect(o.area).toBeGreaterThanOrEqual(r.as - 1e-9)
  })
})

describe('pilar', () => {
  it('esbeltez e capacidade centrada', () => {
    const r = calcularPilar({ b: 30, h: 30, le: 300, fck: 30, fyk: 500, as: 12.56, nk: 1000 })
    expect(r.lam).toBeCloseTo(34.64, 1)
    expect(r.lam1).toBe(35)
    expect(r.classe).toMatch(/Curto/)
    expect(r.nrd).toBeCloseTo(0.85 * (3 / 1.4) * 900 + 12.56 * 42, 0)
    expect(r.atende).toBe(true)
  })
  it('mínimo e entrada inválida', () => {
    expect(calcularPilar({ b: 30, h: 30, le: 300, fck: 30, fyk: 500, as: 1, nk: 500 }).avisos.join()).toMatch(/mínimo/)
    expect(calcularPilar({ b: 0, h: 30, le: 300, fck: 30, fyk: 500, as: 1, nk: 500 }).ok).toBe(false)
  })
})

describe('sapata', () => {
  it('carga centrada', () => {
    const r = calcularSapata({ N: 1000, L: 2.5, B: 2, sigAdm: 250 })
    expect(r.Nt).toBeCloseTo(1100, 6)
    expect(r.med).toBeCloseTo(220, 6)
    expect(r.sMax).toBeCloseTo(220, 6)
    expect(r.areaMin).toBeCloseTo(4.4, 6)
    expect(r.atende).toBe(true)
  })
  it('com momento: trapézio e triângulo', () => {
    const t = calcularSapata({ N: 1000, M: 100, L: 2.5, B: 2, sigAdm: 250 })
    expect(t.sMax).toBeCloseTo(220 * (1 + (6 * (100 / 1100)) / 2.5), 6)
    const g = calcularSapata({ N: 1000, M: 700, L: 2.5, B: 2, sigAdm: 250 })
    expect(g.sMin).toBe(0)
    expect(g.comprimida).toBeLessThan(2.5)
    expect(calcularSapata({ N: 1000, M: 5000, L: 2.5, B: 2, sigAdm: 250 }).ok).toBe(false)
  })
})

describe('unidades', () => {
  it('converte', () => {
    expect(converter('Força', 1, 'tf', 'kN')).toBeCloseTo(9.80665, 5)
    expect(converter('Pressão', 1, 'MPa', 'kgf/cm²')).toBeCloseTo(10.1972, 3)
    expect(converter('Comprimento', 1, 'pol', 'mm')).toBeCloseTo(25.4, 9)
    expect(Number.isNaN(converter('Força', 1, 'kN', 'm'))).toBe(true)
  })
})
