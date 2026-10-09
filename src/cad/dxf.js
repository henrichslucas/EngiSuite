// Leitura e escrita de DXF ASCII (formato com especificação pública da Autodesk). Escrita no nível R12 (AC1009)
// para máxima compatibilidade; leitura de LINE, CIRCLE, ARC, LWPOLYLINE, POLYLINE/VERTEX, TEXT e MTEXT.
import { bulgeArc, dimGeom, norm360, RAD } from './geom.js'

export const ACI = { 1: '#ff4d4d', 2: '#ffd54a', 3: '#4cd964', 4: '#3ad8e6', 5: '#5b8cff', 6: '#e070ff', 7: '#fafaf9', 8: '#8a8a86', 9: '#bdbdb8' }
export const aciHex = (n) => ACI[Math.abs(n)] ?? ACI[7]

function pares(texto) {
  const l = texto.replace(/\r\n?/g, '\n').split('\n')
  const out = []
  for (let i = 0; i + 1 < l.length; i += 2) out.push([parseInt(l[i].trim(), 10), l[i + 1].trim()])
  return out
}

let seq = 0
const newId = () => `i${Date.now().toString(36)}${(seq++).toString(36)}`

export function lerDxf(texto) {
  const g = pares(texto)
  const ents = []
  const layers = new Map()
  const ignorados = {}
  let i = 0
  let secao = ''
  let tabela = ''
  const bloco = () => {
    const d = []
    i++
    while (i < g.length && g[i][0] !== 0) d.push(g[i++])
    return d
  }
  const val = (d, c, f = parseFloat) => {
    const x = d.find(([k]) => k === c)
    return x ? f(x[1]) : undefined
  }
  while (i < g.length) {
    const [c, v] = g[i]
    if (c === 0 && v === 'SECTION') {
      secao = g[i + 1]?.[1] ?? ''
      i += 2
      continue
    }
    if (c === 0 && v === 'ENDSEC') {
      secao = ''
      i++
      continue
    }
    if (secao === 'TABLES') {
      if (c === 0 && v === 'TABLE') tabela = g[i + 1]?.[1] ?? ''
      if (c === 0 && v === 'LAYER' && tabela === 'LAYER') {
        const d = bloco()
        const nome = d.find(([k]) => k === 2)?.[1]
        if (nome) layers.set(nome, { name: nome, color: Math.abs(val(d, 62) ?? 7), visible: (val(d, 62) ?? 7) >= 0 })
        continue
      }
      i++
      continue
    }
    if (secao !== 'ENTITIES' || c !== 0) {
      i++
      continue
    }
    const layerOf = (d) => d.find(([k]) => k === 8)?.[1] ?? '0'
    if (v === 'LINE') {
      const d = bloco()
      ents.push({ id: newId(), type: 'line', layer: layerOf(d), a: [val(d, 10) ?? 0, val(d, 20) ?? 0], b: [val(d, 11) ?? 0, val(d, 21) ?? 0] })
    } else if (v === 'CIRCLE') {
      const d = bloco()
      ents.push({ id: newId(), type: 'circle', layer: layerOf(d), c: [val(d, 10) ?? 0, val(d, 20) ?? 0], r: val(d, 40) ?? 0 })
    } else if (v === 'ARC') {
      const d = bloco()
      ents.push({ id: newId(), type: 'arc', layer: layerOf(d), c: [val(d, 10) ?? 0, val(d, 20) ?? 0], r: val(d, 40) ?? 0, a0: norm360(val(d, 50) ?? 0), a1: norm360(val(d, 51) ?? 0) })
    } else if (v === 'TEXT' || v === 'MTEXT') {
      const d = bloco()
      const t = (d.filter(([k]) => k === 3).map(([, s]) => s).join('') + (d.find(([k]) => k === 1)?.[1] ?? '')).replace(/\\P/g, ' ').replace(/\\[A-Za-z][^;]*;/g, '').replace(/[{}]/g, '')
      ents.push({ id: newId(), type: 'text', layer: layerOf(d), p: [val(d, 10) ?? 0, val(d, 20) ?? 0], h: val(d, 40) ?? 1, text: t, rot: val(d, 50) ?? 0 })
    } else if (v === 'LWPOLYLINE') {
      const d = bloco()
      const pts = []
      const bul = []
      for (let k = 0; k < d.length; k++) {
        if (d[k][0] === 10) {
          pts.push([parseFloat(d[k][1]), parseFloat(d[k + 1]?.[1] ?? '0')])
          bul.push(0)
        } else if (d[k][0] === 42 && bul.length) bul[bul.length - 1] = parseFloat(d[k][1])
      }
      const closed = ((val(d, 70) ?? 0) & 1) === 1
      const full = []
      for (let k = 0; k < pts.length; k++) {
        full.push(pts[k])
        const nxt = pts[(k + 1) % pts.length]
        if ((k < pts.length - 1 || closed) && bul[k]) full.push(...bulgeArc(pts[k], nxt, bul[k]))
      }
      ents.push({ id: newId(), type: 'pline', layer: layerOf(d), pts: full, closed })
    } else if (v === 'POLYLINE') {
      const d = bloco()
      const pts = []
      while (i < g.length && g[i][1] !== 'SEQEND') {
        if (g[i][0] === 0 && g[i][1] === 'VERTEX') {
          const vd = bloco()
          pts.push([val(vd, 10) ?? 0, val(vd, 20) ?? 0])
        } else i++
      }
      ents.push({ id: newId(), type: 'pline', layer: layerOf(d), pts, closed: ((val(d, 70) ?? 0) & 1) === 1 })
    } else {
      ignorados[v] = (ignorados[v] ?? 0) + 1
      i++
    }
  }
  for (const e of ents) if (!layers.has(e.layer)) layers.set(e.layer, { name: e.layer, color: 7, visible: true })
  if (!layers.has('0')) layers.set('0', { name: '0', color: 7, visible: true })
  const naoSuportados = Object.entries(ignorados).filter(([k]) => !['ENDSEC', 'EOF', 'ENDTAB', 'VERTEX', 'SEQEND', 'POINT', 'VIEWPORT'].includes(k))
  return { ents: ents.filter((e) => e.type !== 'circle' && e.type !== 'arc' ? true : e.r > 0), layers: [...layers.values()], ignorados: Object.fromEntries(naoSuportados) }
}

const f = (n) => (Math.round(n * 1e6) / 1e6).toString()

export function escreverDxf(ents, layers, unidade = 6) {
  const o = []
  const p = (c, v) => o.push(String(c), String(v))
  p(0, 'SECTION'); p(2, 'HEADER'); p(9, '$ACADVER'); p(1, 'AC1009'); p(9, '$INSUNITS'); p(70, unidade); p(0, 'ENDSEC')
  p(0, 'SECTION'); p(2, 'TABLES')
  p(0, 'TABLE'); p(2, 'LTYPE'); p(70, 1)
  p(0, 'LTYPE'); p(2, 'CONTINUOUS'); p(70, 0); p(3, 'Solid line'); p(72, 65); p(73, 0); p(40, 0)
  p(0, 'ENDTAB')
  p(0, 'TABLE'); p(2, 'LAYER'); p(70, layers.length)
  for (const l of layers) {
    p(0, 'LAYER'); p(2, l.name); p(70, 0); p(62, l.visible === false ? -l.color : l.color); p(6, 'CONTINUOUS')
  }
  p(0, 'ENDTAB'); p(0, 'ENDSEC')
  p(0, 'SECTION'); p(2, 'ENTITIES')
  const line = (layer, a, b) => { p(0, 'LINE'); p(8, layer); p(10, f(a[0])); p(20, f(a[1])); p(30, 0); p(11, f(b[0])); p(21, f(b[1])); p(31, 0) }
  const text = (layer, pt, h, t, rot = 0) => { p(0, 'TEXT'); p(8, layer); p(10, f(pt[0])); p(20, f(pt[1])); p(30, 0); p(40, f(h)); p(1, t); if (rot) p(50, f(rot)) }
  for (const e of ents) {
    switch (e.type) {
      case 'line': line(e.layer, e.a, e.b); break
      case 'circle': p(0, 'CIRCLE'); p(8, e.layer); p(10, f(e.c[0])); p(20, f(e.c[1])); p(30, 0); p(40, f(e.r)); break
      case 'arc': p(0, 'ARC'); p(8, e.layer); p(10, f(e.c[0])); p(20, f(e.c[1])); p(30, 0); p(40, f(e.r)); p(50, f(e.a0)); p(51, f(e.a1)); break
      case 'text': text(e.layer, e.p, e.h, e.text, e.rot); break
      case 'pline':
        p(0, 'POLYLINE'); p(8, e.layer); p(66, 1); p(70, e.closed ? 1 : 0); p(10, 0); p(20, 0); p(30, 0)
        for (const q of e.pts) { p(0, 'VERTEX'); p(8, e.layer); p(10, f(q[0])); p(20, f(q[1])); p(30, 0) }
        p(0, 'SEQEND'); p(8, e.layer)
        break
      case 'dim': {
        const g = dimGeom(e)
        line(e.layer, e.a, g.ea); line(e.layer, e.b, g.eb); line(e.layer, g.a2, g.b2)
        const h = Math.max(g.L * 0.04, 0.02)
        text(e.layer, [g.m[0] + g.n[0] * h * 0.4, g.m[1] + g.n[1] * h * 0.4], h, f(Math.round(g.L * 100) / 100), g.ang)
        break
      }
    }
  }
  p(0, 'ENDSEC'); p(0, 'EOF')
  return o.join('\n') + '\n'
}

export function escreverSvg(ents, layers) {
  const cor = (n) => aciHex(layers.find((l) => l.name === n)?.color ?? 7)
  const vis = (e) => layers.find((l) => l.name === e.layer)?.visible !== false
  const lista = ents.filter(vis)
  const xs = []
  const ys = []
  const add = (x, y) => { xs.push(x); ys.push(y) }
  const body = []
  const Y = (y) => -y
  for (const e of lista) {
    const c = '#111'
    const col = cor(e.layer) === '#fafaf9' ? c : cor(e.layer)
    const st = `fill="none" stroke="${col}" stroke-width="0.002" vector-effect="non-scaling-stroke"`
    if (e.type === 'line') { add(...e.a); add(...e.b); body.push(`<line x1="${e.a[0]}" y1="${Y(e.a[1])}" x2="${e.b[0]}" y2="${Y(e.b[1])}" ${st}/>`) }
    else if (e.type === 'pline') { e.pts.forEach((q) => add(...q)); body.push(`<${e.closed ? 'polygon' : 'polyline'} points="${e.pts.map((q) => `${q[0]},${Y(q[1])}`).join(' ')}" ${st}/>`) }
    else if (e.type === 'circle') { add(e.c[0] - e.r, e.c[1] - e.r); add(e.c[0] + e.r, e.c[1] + e.r); body.push(`<circle cx="${e.c[0]}" cy="${Y(e.c[1])}" r="${e.r}" ${st}/>`) }
    else if (e.type === 'arc') {
      add(e.c[0] - e.r, e.c[1] - e.r); add(e.c[0] + e.r, e.c[1] + e.r)
      const s = [e.c[0] + e.r * Math.cos(e.a0 * RAD), e.c[1] + e.r * Math.sin(e.a0 * RAD)]
      const t = [e.c[0] + e.r * Math.cos(e.a1 * RAD), e.c[1] + e.r * Math.sin(e.a1 * RAD)]
      const span = norm360(e.a1 - e.a0) || 360
      body.push(`<path d="M${s[0]},${Y(s[1])} A${e.r},${e.r} 0 ${span > 180 ? 1 : 0} 0 ${t[0]},${Y(t[1])}" ${st}/>`)
    } else if (e.type === 'text') { add(...e.p); body.push(`<text x="${e.p[0]}" y="${Y(e.p[1])}" font-size="${e.h}" fill="${col}" transform="rotate(${-(e.rot ?? 0)} ${e.p[0]} ${Y(e.p[1])})">${e.text.replace(/[<&]/g, '')}</text>`) }
    else if (e.type === 'dim') {
      const g = dimGeom(e)
      add(...e.a); add(...e.b); add(...g.a2); add(...g.b2)
      for (const [p1, p2] of [[e.a, g.ea], [e.b, g.eb], [g.a2, g.b2]]) body.push(`<line x1="${p1[0]}" y1="${Y(p1[1])}" x2="${p2[0]}" y2="${Y(p2[1])}" ${st}/>`)
      const h = Math.max(g.L * 0.04, 0.02)
      body.push(`<text x="${g.m[0]}" y="${Y(g.m[1])}" font-size="${h}" text-anchor="middle" fill="${col}" transform="rotate(${-g.ang} ${g.m[0]} ${Y(g.m[1])})">${(Math.round(g.L * 100) / 100).toString()}</text>`)
    }
  }
  const x1 = Math.min(...xs, 0), x2 = Math.max(...xs, 1), y1 = Math.min(...ys, 0), y2 = Math.max(...ys, 1)
  const m = Math.max(x2 - x1, y2 - y1) * 0.04
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x1 - m} ${-(y2 + m)} ${x2 - x1 + 2 * m} ${y2 - y1 + 2 * m}" style="background:#fff">\n${body.join('\n')}\n</svg>\n`
}
