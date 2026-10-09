import { describe, expect, it } from 'vitest'
import { bbox, bboxAll, dimGeom, dist, hit, inBox, mirror, polygonArea, polylineLength, rotate, snapPoints, translate, onArc } from '../src/cad/geom.js'
import { escreverDxf, escreverSvg, lerDxf } from '../src/cad/dxf.js'

const layers = [{ name: '0', color: 7, visible: true }, { name: 'PAREDES', color: 1, visible: true }]
const ents = [
  { id: 'a', type: 'line', layer: 'PAREDES', a: [0, 0], b: [4, 3] },
  { id: 'b', type: 'pline', layer: '0', pts: [[0, 0], [5, 0], [5, 4]], closed: true },
  { id: 'c', type: 'circle', layer: '0', c: [2, 2], r: 1.5 },
  { id: 'd', type: 'arc', layer: '0', c: [0, 0], r: 2, a0: 30, a1: 120 },
  { id: 'e', type: 'text', layer: '0', p: [1, 1], h: 0.2, text: 'Sala 12 m²', rot: 0 }
]

describe('geometria', () => {
  it('hit-test', () => {
    expect(hit(ents[0], [2, 1.5], 0.01)).toBe(true)
    expect(hit(ents[0], [2, 2.5], 0.1)).toBe(false)
    expect(hit(ents[2], [3.5, 2], 0.01)).toBe(true)
    expect(hit(ents[3], [2, 0], 0.05)).toBe(false) // fora do intervalo angular
    expect(hit(ents[3], [0, 2], 0.05)).toBe(true)
    expect(onArc({ c: [0, 0], a0: 350, a1: 20 }, [1, 0])).toBe(true)
  })
  it('bbox e janela', () => {
    expect(bbox(ents[2])).toEqual({ x1: 0.5, y1: 0.5, x2: 3.5, y2: 3.5 })
    expect(bboxAll(ents).x2).toBe(5)
    expect(inBox(ents[0], { x1: 3, y1: 2, x2: 9, y2: 9 })).toBe(true)
    expect(inBox(ents[0], { x1: 5, y1: 5, x2: 9, y2: 9 })).toBe(false)
  })
  it('snap: fim, meio, centro', () => {
    const k = snapPoints(ents[0]).map((s) => s.k)
    expect(k).toEqual(['fim', 'fim', 'meio'])
    expect(snapPoints(ents[2])[0]).toEqual({ p: [2, 2], k: 'centro' })
  })
  it('translate, rotate, mirror', () => {
    expect(translate(ents[0], [1, 1]).b).toEqual([5, 4])
    const r = rotate({ type: 'line', a: [1, 0], b: [2, 0] }, [0, 0], 90)
    expect(r.a[0]).toBeCloseTo(0, 9)
    expect(r.b[1]).toBeCloseTo(2, 9)
    const m = mirror({ type: 'line', a: [1, 1], b: [2, 3] }, [0, 0], [1, 0])
    expect(m.a).toEqual([1, -1])
    expect(rotate(ents[3], [0, 0], 90).a0).toBe(120)
  })
  it('medidas', () => {
    expect(polylineLength([[0, 0], [3, 0], [3, 4]], false)).toBe(7)
    expect(polylineLength([[0, 0], [3, 0], [3, 4]], true)).toBe(12)
    expect(polygonArea([[0, 0], [4, 0], [4, 3], [0, 3]])).toBe(12)
    expect(dist([0, 0], [3, 4])).toBe(5)
  })
  it('cota alinhada', () => {
    const g = dimGeom({ a: [0, 0], b: [4, 0], off: 1 })
    expect(g.L).toBe(4)
    expect(g.a2).toEqual([0, 1])
    expect(g.ang).toBe(0)
  })
})

describe('DXF', () => {
  it('ida e volta', () => {
    const txt = escreverDxf(ents, layers)
    expect(txt).toMatch(/AC1009/)
    const r = lerDxf(txt)
    expect(r.ents.length).toBe(5)
    const by = (t) => r.ents.find((e) => e.type === t)
    expect(by('line')).toMatchObject({ a: [0, 0], b: [4, 3], layer: 'PAREDES' })
    expect(by('pline')).toMatchObject({ closed: true })
    expect(by('pline').pts).toEqual([[0, 0], [5, 0], [5, 4]])
    expect(by('circle')).toMatchObject({ c: [2, 2], r: 1.5 })
    expect(by('arc')).toMatchObject({ a0: 30, a1: 120 })
    expect(by('text').text).toBe('Sala 12 m²')
    expect(r.layers.find((l) => l.name === 'PAREDES').color).toBe(1)
  })
  it('cota é explodida em linhas e texto', () => {
    const r = lerDxf(escreverDxf([{ id: 'x', type: 'dim', layer: '0', a: [0, 0], b: [4, 0], off: 1 }], layers))
    expect(r.ents.filter((e) => e.type === 'line').length).toBe(3)
    expect(r.ents.find((e) => e.type === 'text').text).toBe('4')
  })
  it('lê LWPOLYLINE (com bulge), MTEXT e informa entidades não suportadas', () => {
    const dxf = ['0','SECTION','2','ENTITIES','0','LWPOLYLINE','8','X','90','2','70','0','10','0','20','0','42','1','10','2','20','0','0','MTEXT','8','X','10','1','20','1','40','0.5','1','Olá\\Pmundo','0','SPLINE','8','X','0','ENDSEC','0','EOF'].join('\n')
    const r = lerDxf(dxf)
    const pl = r.ents.find((e) => e.type === 'pline')
    expect(pl.pts.length).toBeGreaterThan(3)
    expect(pl.pts[0]).toEqual([0, 0])
    expect(pl.pts[pl.pts.length - 1]).toEqual([2, 0])
    expect(r.ents.find((e) => e.type === 'text').text).toBe('Olá mundo')
    expect(r.ignorados).toEqual({ SPLINE: 1 })
  })
  it('SVG tem uma forma por entidade visível', () => {
    const svg = escreverSvg(ents, layers)
    expect(svg).toMatch(/<svg/)
    expect((svg.match(/<(line|polygon|circle|path|text)/g) ?? []).length).toBe(5)
    expect(escreverSvg(ents, layers.map((l) => ({ ...l, visible: false })))).not.toMatch(/<line/)
  })
})
