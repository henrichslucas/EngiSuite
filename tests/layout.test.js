import { describe, expect, it } from 'vitest'
import { CATALOGO, extensao, gruposDe, itensDe, opcoesPadrao } from '../src/viewer3d/catalog.js'
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
      const folga = c.folga ?? 0.05
      const variantes = c.opcoes ? [opcoesPadrao(k), ...c.opcoes.flatMap((o) => o.valores.map(([v]) => ({ ...opcoesPadrao(k), [o.k]: v })))] : [undefined]
      for (const op of variantes) {
        const partes = c.partes(c.w, c.d, c.h, op)
        expect(partes.length, k).toBeGreaterThan(0)
        for (const p of partes) {
          const { ex, ey, ez } = extensao(p)
          expect(Math.abs(p.x) + ex / 2, `${k} x`).toBeLessThanOrEqual(c.w / 2 + folga)
          expect(Math.abs(p.z) + ez / 2, `${k} z`).toBeLessThanOrEqual(c.d / 2 + folga)
          expect(p.y - ey / 2, `${k} y0`).toBeGreaterThanOrEqual(-0.01)
          expect(p.y + ey / 2, `${k} y1`).toBeLessThanOrEqual(c.h + 0.06)
        }
      }
    }
  })
  it('cada item tem modo e grupo; zonas não colidem', () => {
    for (const [k, c] of Object.entries(CATALOGO)) {
      expect(['interno', 'externo', 'ambos', undefined], k).toContain(c.modo)
      if (c.zona) expect(c.fantasma, k).toBe(true)
    }
    expect(gruposDe('externo')).toEqual(expect.arrayContaining(['Pisos e solo', 'Vegetação', 'Construção', 'Área externa']))
    expect(gruposDe('interno')).not.toContain('Vegetação')
    expect(itensDe('externo', 'Pisos e solo').map(([k]) => k)).toContain('gramado')
  })
  it('novo item parte do centro com dimensões do catálogo', () => {
    const n = novoItem('sofa', sala)
    expect(n).toMatchObject({ x: 2, z: 1.5, w: 2, d: 0.9, h: 0.85 })
  })
})

describe('cenas de exemplo', () => {
  it('ficam dentro do terreno/cômodo e sem colisões', async () => {
    const { exemploExterno, exemploInterno, salaPadrao } = await import('../src/viewer3d/exemplos.js')
    for (const modo of ['interno', 'externo']) {
      const sala = salaPadrao(modo)
      const itens = modo === 'externo' ? exemploExterno(sala) : exemploInterno(sala)
      expect(itens.length).toBeGreaterThan(2)
      for (const i of itens) {
        const b = caixa(i)
        expect(b.x1, `${i.tipo} x1`).toBeGreaterThanOrEqual(-1e-6)
        expect(b.z1, `${i.tipo} z1`).toBeGreaterThanOrEqual(-1e-6)
        expect(b.x2, `${i.tipo} x2`).toBeLessThanOrEqual(sala.w + 1e-6)
        expect(b.z2, `${i.tipo} z2`).toBeLessThanOrEqual(sala.d + 1e-6)
      }
      expect([...colisoes(itens)].map((id) => itens.find((i) => i.id === id).tipo)).toEqual([])
    }
  })
})
