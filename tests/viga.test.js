import { describe, expect, it } from 'vitest'
import { areaBarra, calcularViga, parametrosConcreto } from '../src/modules/viga.js'

const base = { bw: 20, h: 50, dl: 4, fck: 25, fyk: 500, msk: 100 }

describe('calcularViga', () => {
  it('armadura simples (conferido à mão: As ≈ 8,0 cm²)', () => {
    const r = calcularViga(base)
    expect(r.ok).toBe(true)
    expect(r.dupla).toBe(false)
    expect(r.md).toBeCloseTo(140, 6)
    expect(r.xi).toBeCloseTo(0.311, 2)
    expect(r.as).toBeCloseTo(8.0, 1)
    expect(r.asl).toBe(0)
  })

  it('armadura dupla quando x/d excede 0,45', () => {
    const r = calcularViga({ ...base, msk: 180 })
    expect(r.ok).toBe(true)
    expect(r.dupla).toBe(true)
    expect(r.xi).toBe(0.45)
    expect(r.asl).toBeGreaterThan(0)
    expect(r.as).toBeGreaterThan(calcularViga({ ...base, msk: 150 }).as)
  })

  it('usa armadura mínima para momento pequeno', () => {
    const r = calcularViga({ ...base, msk: 5 })
    expect(r.as).toBe(r.asMin)
    expect(r.asMin).toBeGreaterThanOrEqual(0.0015 * 20 * 50)
    expect(r.avisos.join(' ')).toMatch(/mínima/)
  })

  it('rejeita seção insuficiente e entradas inválidas', () => {
    expect(calcularViga({ ...base, msk: 2000 }).ok).toBe(false)
    expect(calcularViga({ ...base, bw: NaN }).ok).toBe(false)
    expect(calcularViga({ ...base, fck: 10 }).ok).toBe(false)
    expect(calcularViga({ ...base, dl: 30 }).ok).toBe(false)
  })

  it('sugere bitolas que cobrem a área necessária', () => {
    const r = calcularViga(base)
    for (const o of r.tracao) expect(o.area).toBeGreaterThanOrEqual(r.as - 1e-9)
    expect(r.tracao.find((o) => o.phi === 20).n).toBe(3)
  })
})

it('parâmetros do concreto mudam acima de C50', () => {
  expect(parametrosConcreto(30)).toMatchObject({ lambda: 0.8, alphaC: 0.85, xiLim: 0.45 })
  const p = parametrosConcreto(70)
  expect(p.lambda).toBeCloseTo(0.75, 6)
  expect(p.alphaC).toBeCloseTo(0.765, 6)
  expect(p.xiLim).toBe(0.35)
})

it('área de barra', () => {
  expect(areaBarra(10)).toBeCloseTo(0.7854, 4)
})
