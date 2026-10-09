// Posicionamento em planta: retângulos orientados, colisões e limites do cômodo (metros, graus).
import { CATALOGO } from './catalog.js'

const RAD = Math.PI / 180

export function cantos(it) {
  const c = Math.cos(it.rot * RAD)
  const s = Math.sin(it.rot * RAD)
  const hw = it.w / 2
  const hd = it.d / 2
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, z]) => [it.x + x * c - z * s, it.z + x * s + z * c])
}

export function caixa(it) {
  const p = cantos(it)
  return { x1: Math.min(...p.map((q) => q[0])), x2: Math.max(...p.map((q) => q[0])), z1: Math.min(...p.map((q) => q[1])), z2: Math.max(...p.map((q) => q[1])) }
}

// teste de eixo separador entre dois retângulos orientados
export function sobrepoe(a, b, folga = 1e-6) {
  const pa = cantos(a)
  const pb = cantos(b)
  for (const poly of [pa, pb]) {
    for (let i = 0; i < 4; i++) {
      const p = poly[i]
      const q = poly[(i + 1) % 4]
      const ax = -(q[1] - p[1])
      const az = q[0] - p[0]
      const proj = (pts) => pts.map((r) => r[0] * ax + r[1] * az)
      const A = proj(pa)
      const B = proj(pb)
      if (Math.max(...A) <= Math.min(...B) + folga || Math.max(...B) <= Math.min(...A) + folga) return false
    }
  }
  return true
}

const ocupa = (it) => !CATALOGO[it.tipo]?.fantasma
const alt = (it) => (it.elev ?? CATALOGO[it.tipo]?.elev ?? 0)

// ids de itens em colisão (ignora aberturas e tapetes; itens em alturas disjuntas não colidem)
export function colisoes(items) {
  const out = new Set()
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (!ocupa(a) || !ocupa(b)) continue
      if (alt(a) >= alt(b) + b.h - 1e-6 || alt(b) >= alt(a) + a.h - 1e-6) continue
      if (sobrepoe(a, b)) {
        out.add(a.id)
        out.add(b.id)
      }
    }
  }
  return out
}

// mantém o item dentro do cômodo ([0,w] × [0,d])
export function limitar(it, sala) {
  const b = caixa(it)
  let { x, z } = it
  if (b.x1 < 0) x += -b.x1
  if (b.x2 > sala.w) x -= b.x2 - sala.w
  if (b.z1 < 0) z += -b.z1
  if (b.z2 > sala.d) z -= b.z2 - sala.d
  return { ...it, x, z }
}

export const grade = (v, g) => (g > 0 ? Math.round(v / g) * g : v)

export function ocupacao(items, sala) {
  const area = items.filter(ocupa).reduce((s, it) => s + it.w * it.d, 0)
  return { area, pct: (area / (sala.w * sala.d)) * 100, livre: sala.w * sala.d - area }
}

let n = 0
export const novoItem = (tipo, sala) => {
  const c = CATALOGO[tipo]
  return { id: `m${Date.now().toString(36)}${(n++).toString(36)}`, tipo, x: sala.w / 2, z: sala.d / 2, rot: 0, w: c.w, d: c.d, h: c.h, cor: c.cor, elev: c.elev ?? 0 }
}
