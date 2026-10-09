import { describe, expect, it } from 'vitest'
import { CATALOGO } from '../src/viewer3d/catalog.js'
import { cantos, caixa, colisoes, grade, limitar, novoItem, ocupacao, sobrepoe } from '../src/viewer3d/layout.js'

const sala = { w: 4, d: 3, h: 2.7 }
const mk = (o) => ({ id: 'a', tipo: 'caixa', x: 1, z: 1, rot: 0, w: 1, d: 1, h: 1, elev: 0, ...o })

describe('layout', () => {
  it('cantos e caixa com rotação', () => {
    const c = caixa(mk({ w: 2, d: 1, rot: 90, x: 2, z: 2 }))
    expect(c.x1).toBeCloseTo(1.5, 9)
    expect(c.x2).toBeCloseTo(2.5, 9)
    expect(c.z1).toBeCloseTo(1, 9)
    expect(c.z2).toBeCloseTo(3, 9)
    expect(cantos(mk()).length).toBe(4)
  })
  it('sobreposição, inclusive girada 45°', () => {
    expect(sobrepoe(mk({ x: 1 }), mk({ x: 1.5 }))).toBe(true)
    expect(sobrepoe(mk({ x: 1 }), mk({ x: 2 }))).toBe(false) // encostados
    expect(sobrepoe(mk({ x: 1, z: 1 }), mk({ x: 1.95, z: 1.95, rot: 45 }))).toBe(false)
    expect(sobrepoe(mk({ x: 1, z: 1 }), mk({ x: 1.6, z: 1.6, rot: 45 }))).toBe(true)
  })
  it('colisões ignoram aberturas e alturas disjuntas', () => {
    const a = mk({ id: 'a' })
    const b = mk({ id: 'b', x: 1.3 })
    expect([...colisoes([a, b])].sort()).toEqual(['a', 'b'])
    expect(colisoes([a, { ...b, tipo: 'tapete' }]).size).toBe(0)
    expect(colisoes([a, { ...b, elev: 1.2 }]).size).toBe(0)
  })
  it('limita ao cômodo', () => {
    expect(limitar(mk({ x: -5, z: 10 }), sala)).toMatchObject({ x: 0.5, z: 2.5 })
    const r = limitar(mk({ x: 3.9, z: 1, w: 2, rot: 0 }), sala)
    expect(r.x).toBeCloseTo(3, 9)
  })
  it('grade e ocupação', () => {
    expect(grade(1.23, 0.05)).toBeCloseTo(1.25, 9)
    expect(grade(1.23, 0)).toBe(1.23)
    const o = ocupacao([mk(), mk({ tipo: 'tapete', w: 3, d: 2 })], sala)
    expect(o.area).toBe(1)
    expect(o.pct).toBeCloseTo((1 / 12) * 100, 9)
  })
})

describe('catálogo', () => {
  it('todas as partes ficam dentro das dimensões declaradas', () => {
    for (const [k, c] of Object.entries(CATALOGO)) {
      const partes = c.partes(c.w, c.d, c.h)
      expect(partes.length, k).toBeGreaterThan(0)
      for (const p of partes) {
        const sx = p.t === 'box' ? p.sx : p.r * 2
        const sz = p.t === 'box' ? p.sz : p.r * 2
        expect(Math.abs(p.x) + sx / 2, `${k} x`).toBeLessThanOrEqual(c.w / 2 + 0.05)
        expect(Math.abs(p.z) + sz / 2, `${k} z`).toBeLessThanOrEqual(c.d / 2 + 0.05)
        expect(p.y - p.sy / 2, `${k} y0`).toBeGreaterThanOrEqual(-0.01)
        expect(p.y + p.sy / 2, `${k} y1`).toBeLessThanOrEqual(c.h + 0.06)
      }
    }
  })
  it('novo item parte do centro com dimensões do catálogo', () => {
    const n = novoItem('sofa', sala)
    expect(n).toMatchObject({ x: 2, z: 1.5, w: 2, d: 0.9, h: 0.85 })
  })
})
