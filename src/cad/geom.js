// Geometria 2D para o módulo de desenho. Entidades:
//  { id, type: 'line', layer, a:[x,y], b:[x,y] }
//  { id, type: 'pline', layer, pts:[[x,y],...], closed }
//  { id, type: 'circle', layer, c:[x,y], r }
//  { id, type: 'arc', layer, c:[x,y], r, a0, a1 }   (graus, sentido anti-horário de a0 até a1)
//  { id, type: 'text', layer, p:[x,y], h, text, rot }
//  { id, type: 'dim', layer, a:[x,y], b:[x,y], off }  (cota alinhada; off = distância da linha de cota)

export const RAD = Math.PI / 180
export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
export const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
export const angDeg = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD
export const polar = (p, d, deg) => [p[0] + d * Math.cos(deg * RAD), p[1] + d * Math.sin(deg * RAD)]
export const norm360 = (a) => ((a % 360) + 360) % 360

export function distToSegment(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l2 = dx * dx + dy * dy
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2))
  return dist(p, [a[0] + t * dx, a[1] + t * dy])
}

export function onArc(e, p) {
  const a = norm360(angDeg(e.c, p))
  const a0 = norm360(e.a0)
  const span = norm360(e.a1 - e.a0) || 360
  return norm360(a - a0) <= span
}

// geometria da cota: pontos da linha de cota deslocada
export function dimGeom(e) {
  const L = dist(e.a, e.b) || 1e-9
  const ux = (e.b[0] - e.a[0]) / L
  const uy = (e.b[1] - e.a[1]) / L
  const nx = -uy
  const ny = ux
  const s = Math.sign(e.off) || 1
  const a2 = [e.a[0] + nx * e.off, e.a[1] + ny * e.off]
  const b2 = [e.b[0] + nx * e.off, e.b[1] + ny * e.off]
  const ext = Math.abs(e.off) * 0.1 + 0
  return { L, a2, b2, ea: [a2[0] + nx * s * ext, a2[1] + ny * s * ext], eb: [b2[0] + nx * s * ext, b2[1] + ny * s * ext], m: mid(a2, b2), ang: angDeg(e.a, e.b), u: [ux, uy], n: [nx, ny] }
}

export function segments(e) {
  switch (e.type) {
    case 'line':
      return [[e.a, e.b]]
    case 'pline': {
      const s = []
      for (let i = 0; i < e.pts.length - 1; i++) s.push([e.pts[i], e.pts[i + 1]])
      if (e.closed && e.pts.length > 2) s.push([e.pts[e.pts.length - 1], e.pts[0]])
      return s
    }
    case 'dim': {
      const g = dimGeom(e)
      return [[e.a, g.ea], [e.b, g.eb], [g.a2, g.b2]]
    }
    default:
      return []
  }
}

export function hit(e, p, tol) {
  switch (e.type) {
    case 'line':
    case 'pline':
    case 'dim':
      return segments(e).some(([a, b]) => distToSegment(p, a, b) <= tol)
    case 'circle':
      return Math.abs(dist(p, e.c) - e.r) <= tol
    case 'arc':
      return Math.abs(dist(p, e.c) - e.r) <= tol && onArc(e, p)
    case 'text': {
      const w = e.text.length * e.h * 0.6
      return p[0] >= e.p[0] - tol && p[0] <= e.p[0] + w + tol && p[1] >= e.p[1] - tol && p[1] <= e.p[1] + e.h + tol
    }
  }
  return false
}

export function bbox(e) {
  let pts = []
  switch (e.type) {
    case 'line':
      pts = [e.a, e.b]
      break
    case 'pline':
      pts = e.pts
      break
    case 'circle':
    case 'arc':
      pts = [[e.c[0] - e.r, e.c[1] - e.r], [e.c[0] + e.r, e.c[1] + e.r]]
      break
    case 'text':
      pts = [e.p, [e.p[0] + e.text.length * e.h * 0.6, e.p[1] + e.h]]
      break
    case 'dim': {
      const g = dimGeom(e)
      pts = [e.a, e.b, g.a2, g.b2]
      break
    }
  }
  if (!pts.length) return null
  return { x1: Math.min(...pts.map((p) => p[0])), y1: Math.min(...pts.map((p) => p[1])), x2: Math.max(...pts.map((p) => p[0])), y2: Math.max(...pts.map((p) => p[1])) }
}

export function bboxAll(ents) {
  let r = null
  for (const e of ents) {
    const b = bbox(e)
    if (!b) continue
    r = r ? { x1: Math.min(r.x1, b.x1), y1: Math.min(r.y1, b.y1), x2: Math.max(r.x2, b.x2), y2: Math.max(r.y2, b.y2) } : b
  }
  return r
}

// entidade tem pelo menos parte dentro do retângulo (seleção por janela)
export function inBox(e, box) {
  const b = bbox(e)
  return !!b && b.x2 >= box.x1 && b.x1 <= box.x2 && b.y2 >= box.y1 && b.y1 <= box.y2
}

export function snapPoints(e) {
  switch (e.type) {
    case 'line':
      return [{ p: e.a, k: 'fim' }, { p: e.b, k: 'fim' }, { p: mid(e.a, e.b), k: 'meio' }]
    case 'pline': {
      const out = e.pts.map((p) => ({ p, k: 'fim' }))
      for (const [a, b] of segments(e)) out.push({ p: mid(a, b), k: 'meio' })
      return out
    }
    case 'circle':
      return [{ p: e.c, k: 'centro' }, ...[0, 90, 180, 270].map((a) => ({ p: polar(e.c, e.r, a), k: 'quadrante' }))]
    case 'arc':
      return [{ p: e.c, k: 'centro' }, { p: polar(e.c, e.r, e.a0), k: 'fim' }, { p: polar(e.c, e.r, e.a1), k: 'fim' }]
    case 'text':
      return [{ p: e.p, k: 'inserção' }]
    case 'dim':
      return [{ p: e.a, k: 'fim' }, { p: e.b, k: 'fim' }]
  }
  return []
}

export function translate(e, d) {
  const mv = (p) => [p[0] + d[0], p[1] + d[1]]
  const o = { ...e }
  if (o.a) o.a = mv(o.a)
  if (o.b) o.b = mv(o.b)
  if (o.c) o.c = mv(o.c)
  if (o.p) o.p = mv(o.p)
  if (o.pts) o.pts = o.pts.map(mv)
  return o
}

export function rotate(e, c, deg) {
  const cs = Math.cos(deg * RAD)
  const sn = Math.sin(deg * RAD)
  const rp = (p) => [c[0] + (p[0] - c[0]) * cs - (p[1] - c[1]) * sn, c[1] + (p[0] - c[0]) * sn + (p[1] - c[1]) * cs]
  const o = { ...e }
  if (o.a) o.a = rp(o.a)
  if (o.b) o.b = rp(o.b)
  if (o.c) o.c = rp(o.c)
  if (o.p) o.p = rp(o.p)
  if (o.pts) o.pts = o.pts.map(rp)
  if (o.type === 'arc') {
    o.a0 = norm360(o.a0 + deg)
    o.a1 = norm360(o.a1 + deg)
  }
  if (o.type === 'text') o.rot = norm360((o.rot ?? 0) + deg)
  return o
}

export function mirror(e, p1, p2) {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  const l2 = dx * dx + dy * dy || 1
  const rp = (p) => {
    const t = ((p[0] - p1[0]) * dx + (p[1] - p1[1]) * dy) / l2
    const fx = p1[0] + t * dx
    const fy = p1[1] + t * dy
    return [2 * fx - p[0], 2 * fy - p[1]]
  }
  const o = { ...e }
  if (o.a) o.a = rp(o.a)
  if (o.b) o.b = rp(o.b)
  if (o.c) o.c = rp(o.c)
  if (o.p) o.p = rp(o.p)
  if (o.pts) o.pts = o.pts.map(rp)
  if (o.type === 'arc') {
    const ax = 2 * angDeg(p1, p2)
    const n0 = norm360(ax - o.a1)
    const n1 = norm360(ax - o.a0)
    o.a0 = n0
    o.a1 = n1
  }
  return o
}

export function polylineLength(pts, closed) {
  let s = 0
  for (let i = 0; i < pts.length - 1; i++) s += dist(pts[i], pts[i + 1])
  if (closed && pts.length > 2) s += dist(pts[pts.length - 1], pts[0])
  return s
}

export function polygonArea(pts) {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    s += x1 * y2 - x2 * y1
  }
  return Math.abs(s) / 2
}

// bulge (DXF LWPOLYLINE) -> pontos intermediários do arco
export function bulgeArc(p, q, bulge, n = 12) {
  if (!bulge) return []
  const theta = 4 * Math.atan(bulge)
  const ch = dist(p, q)
  const r = ch / 2 / Math.sin(Math.abs(theta) / 2)
  const m = mid(p, q)
  const h = Math.sqrt(Math.max(r * r - (ch / 2) ** 2, 0)) * Math.sign(bulge) * (Math.abs(theta) > Math.PI ? -1 : 1)
  const ux = (q[0] - p[0]) / ch
  const uy = (q[1] - p[1]) / ch
  const c = [m[0] - uy * h, m[1] + ux * h]
  const a0 = Math.atan2(p[1] - c[1], p[0] - c[0])
  const out = []
  for (let i = 1; i < n; i++) {
    const a = a0 + (theta * i) / n
    out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)])
  }
  return out
}
