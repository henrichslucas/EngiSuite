<script>
  import { onMount } from 'svelte'
  import { drawing as D } from './doc.svelte.js'
  import { aciHex, escreverDxf, escreverSvg, lerDxf } from './dxf.js'
  import { angDeg, bbox, dimGeom, dist, hit, inBox, mid, mirror, norm360, polar, polygonArea, polylineLength, rotate, segments, snapPoints, translate, RAD } from './geom.js'

  let wrap
  let canvas
  let cmdEl
  let fileEl
  let W = $state(800)
  let H = $state(500)
  let tool = $state('select')
  let pts = $state([])
  let cur = $state([0, 0])
  let snap = $state(null)
  let box = $state(null)
  let drag = $state(null)
  let msg = $state('')
  let cmd = $state('')
  let layersOpen = $state(false)
  let newLayer = $state('')
  let space = false
  const pointers = new Map()
  let pan = null
  let pinch = null

  const FERRAMENTAS = [
    ['select', 'Selecionar', 'V'],
    ['line', 'Linha', 'L'],
    ['pline', 'Polilinha', 'PL'],
    ['rect', 'Retângulo', 'REC'],
    ['circle', 'Círculo', 'C'],
    ['arc', 'Arco', 'A'],
    ['text', 'Texto', 'T'],
    ['dim', 'Cota', 'DIM'],
    ['measure', 'Medir', 'MED'],
    ['move', 'Mover', 'M'],
    ['copy', 'Copiar', 'CO'],
    ['rotate', 'Girar', 'RO'],
    ['mirror', 'Espelhar', 'MI'],
    ['pan', 'Mover vista', 'P']
  ]
  const ALIAS = { v: 'select', l: 'line', line: 'line', pl: 'pline', rec: 'rect', c: 'circle', a: 'arc', t: 'text', dim: 'dim', med: 'measure', m: 'move', co: 'copy', ro: 'rotate', mi: 'mirror', p: 'pan' }

  const PASSOS = {
    select: 'Clique para selecionar, arraste para janela. Delete apaga.',
    line: ['Primeiro ponto', 'Próximo ponto (Enter ou botão direito encerra)'],
    pline: ['Primeiro ponto', 'Próximo ponto (Enter ou duplo clique encerra, “cl” fecha)'],
    rect: ['Primeiro canto', 'Canto oposto (ou largura;altura)'],
    circle: ['Centro', 'Raio (clique ou digite o valor)'],
    arc: ['Centro', 'Ponto inicial (define o raio)', 'Ponto final (sentido anti-horário)'],
    text: 'Clique onde inserir o texto',
    dim: ['Primeiro ponto', 'Segundo ponto', 'Posição da linha de cota'],
    measure: ['Primeiro ponto', 'Segundo ponto'],
    move: ['Ponto base', 'Destino'],
    copy: ['Ponto base', 'Destino (clique repetidamente; Enter encerra)'],
    rotate: ['Centro', 'Direção de referência', 'Nova direção (ou digite o ângulo)'],
    mirror: ['Primeiro ponto do eixo', 'Segundo ponto do eixo'],
    pan: 'Arraste para mover a vista'
  }
  const hint = $derived.by(() => {
    const p = PASSOS[tool]
    return Array.isArray(p) ? p[Math.min(pts.length, p.length - 1)] : p
  })

  const sx = (x) => W / 2 + (x - D.view.cx) * D.view.k
  const sy = (y) => H / 2 - (y - D.view.cy) * D.view.k
  const wx = (px) => D.view.cx + (px - W / 2) / D.view.k
  const wy = (py) => D.view.cy - (py - H / 2) / D.view.k
  const fmt = (n) => (Math.round(n * 1000) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 3 })

  function setTool(t) {
    if ((t === 'move' || t === 'copy' || t === 'rotate' || t === 'mirror') && !D.sel.length) {
      msg = 'Selecione objetos antes (ferramenta Selecionar).'
      return
    }
    tool = t
    pts = []
    box = null
    drag = null
    msg = ''
  }

  function cancel() {
    if (pts.length || box || drag) {
      pts = []
      box = null
      drag = null
    } else tool = 'select'
    msg = ''
  }

  // ---------- pontos e snaps ----------
  function constrain(raw) {
    let p = raw
    const last = pts[pts.length - 1]
    if (D.ortho && last && tool !== 'select' && tool !== 'text') {
      const dx = Math.abs(raw[0] - last[0])
      const dy = Math.abs(raw[1] - last[1])
      p = dx >= dy ? [raw[0], last[1]] : [last[0], raw[1]]
    }
    return p
  }

  function computeSnap(raw) {
    const tol = 11 / D.view.k
    if (D.snapObj) {
      let best = null
      let bd = tol
      for (const e of D.ents) {
        if (!D.visible(e)) continue
        const b = bbox(e)
        if (!b || raw[0] < b.x1 - tol || raw[0] > b.x2 + tol || raw[1] < b.y1 - tol || raw[1] > b.y2 + tol) continue
        for (const s of snapPoints(e)) {
          const d = dist(raw, s.p)
          if (d < bd) {
            bd = d
            best = s
          }
        }
      }
      if (best) return { p: best.p, k: best.k }
    }
    let p = constrain(raw)
    if (D.snapGrid && D.grid > 0) {
      const g = D.grid
      const r = [Math.round(p[0] / g) * g, Math.round(p[1] / g) * g]
      const last = pts[pts.length - 1]
      if (D.ortho && last) {
        if (Math.abs(p[1] - last[1]) < 1e-9) r[1] = last[1]
        else r[0] = last[0]
      }
      p = r
    }
    return { p, k: null }
  }

  // Coordenadas separadas por ";" (a vírgula é o separador decimal): 3;4 · @2,5;0 · @5<45 · distância: 2,5
  function parsePoint(text) {
    const t = text.trim().replace(/\s+/g, '')
    const last = pts[pts.length - 1] ?? [0, 0]
    const num = (s) => Number(s.replace(',', '.'))
    const N = '(-?\\d+(?:[.,]\\d+)?)'
    let m
    if ((m = t.match(new RegExp(`^(@?)${N}<${N}$`)))) return polar(m[1] ? last : [0, 0], num(m[2]), num(m[3]))
    if ((m = t.match(new RegExp(`^(@?)${N};${N}$`)))) {
      const base = m[1] ? last : [0, 0]
      return [base[0] + num(m[2]), base[1] + num(m[3])]
    }
    if (new RegExp(`^${N}$`).test(t)) {
      const d = num(t)
      if (tool === 'circle' && pts.length === 1) return polar(pts[0], d, 0)
      if (tool === 'rotate' && pts.length === 2) return polar(pts[0], 1, angDeg(pts[0], pts[1]) + d)
      if (!pts.length) return null
      const dirP = constrain(cur)
      const a = dist(last, dirP) > 1e-9 ? angDeg(last, dirP) : 0
      return polar(last, d, a)
    }
    return null
  }

  function onCommand() {
    const raw = cmd.trim()
    cmd = ''
    if (raw === '') {
      finish()
      return
    }
    const low = raw.toLowerCase()
    if (low === 'u' || low === 'z') return D.undo()
    if (low === 'r' || low === 'redo') return D.redo()
    if (low === 'e' || low === 'del') return D.removeSel()
    if (low === 'ze' || low === 'zoom') return zoomExtents()
    if (low === 'cl' || low === 'fechar') {
      if (tool === 'pline' && pts.length > 2) {
        D.add({ type: 'pline', pts: pts.map((p) => [...p]), closed: true })
        pts = []
      }
      return
    }
    if (tool === 'rect' && pts.length === 1) {
      const m = raw.replace(/\s/g, '').match(/^(-?\d+(?:[.,]\d+)?)[;x](-?\d+(?:[.,]\d+)?)$/i)
      if (m) {
        const w = Number(m[1].replace(',', '.'))
        const h = Number(m[2].replace(',', '.'))
        return click([pts[0][0] + w, pts[0][1] + h])
      }
    }
    if (ALIAS[low] && !/^-?\d/.test(low)) return setTool(ALIAS[low])
    const p = parsePoint(raw)
    if (p) return click(p)
    msg = `Comando ou ponto inválido: “${raw}”`
  }

  function finish() {
    if (tool === 'pline' && pts.length >= 2) D.add({ type: 'pline', pts: pts.map((p) => [...p]), closed: false })
    if (tool === 'copy' && pts.length) pts = []
    else pts = []
    if (tool === 'select') D.sel = []
  }

  // ---------- comandos por clique ----------
  function click(p) {
    msg = ''
    const last = pts[pts.length - 1]
    switch (tool) {
      case 'line':
        if (!last) pts = [p]
        else {
          if (dist(last, p) > 1e-9) D.add({ type: 'line', a: [...last], b: [...p] })
          pts = [p]
        }
        break
      case 'pline':
        pts = [...pts, p]
        break
      case 'rect':
        if (!last) pts = [p]
        else {
          const [a, b] = [last, p]
          if (Math.abs(a[0] - b[0]) > 1e-9 && Math.abs(a[1] - b[1]) > 1e-9) D.add({ type: 'pline', pts: [a, [b[0], a[1]], b, [a[0], b[1]]], closed: true })
          pts = []
        }
        break
      case 'circle':
        if (!last) pts = [p]
        else {
          const r = dist(last, p)
          if (r > 1e-9) D.add({ type: 'circle', c: [...last], r })
          pts = []
        }
        break
      case 'arc':
        if (pts.length < 2) pts = [...pts, p]
        else {
          const r = dist(pts[0], pts[1])
          D.add({ type: 'arc', c: [...pts[0]], r, a0: norm360(angDeg(pts[0], pts[1])), a1: norm360(angDeg(pts[0], p)) })
          pts = []
        }
        break
      case 'text': {
        const t = window.prompt('Texto:')
        if (t) D.add({ type: 'text', p: [...p], h: D.textH, text: t, rot: 0, layer: D.layer })
        break
      }
      case 'dim':
        if (pts.length < 2) pts = [...pts, p]
        else {
          const [a, b] = pts
          const L = dist(a, b) || 1
          const off = ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / L
          D.add({ type: 'dim', a: [...a], b: [...b], off, layer: D.layerOf('COTAS') ? 'COTAS' : D.layer })
          pts = []
        }
        break
      case 'measure':
        if (!last) pts = [p]
        else {
          msg = `Distância ${fmt(dist(last, p))} ${D.unidade} · ângulo ${fmt(norm360(angDeg(last, p)))}° · Δx ${fmt(p[0] - last[0])} · Δy ${fmt(p[1] - last[1])}`
          pts = []
        }
        break
      case 'move':
      case 'copy':
        if (!last) pts = [p]
        else {
          const d = [p[0] - last[0], p[1] - last[1]]
          const sel = D.ents.filter((e) => D.sel.includes(e.id))
          if (tool === 'move') {
            D.replaceMany(new Map(sel.map((e) => [e.id, translate(e, d)])))
            pts = []
          } else {
            D.add(...sel.map((e) => ({ ...translate(e, d), id: undefined })))
          }
        }
        break
      case 'rotate':
        if (pts.length < 2) pts = [...pts, p]
        else {
          const ang = angDeg(pts[0], p) - angDeg(pts[0], pts[1])
          const sel = D.ents.filter((e) => D.sel.includes(e.id))
          D.replaceMany(new Map(sel.map((e) => [e.id, rotate(e, pts[0], ang)])))
          pts = []
        }
        break
      case 'mirror':
        if (!last) pts = [p]
        else {
          const sel = D.ents.filter((e) => D.sel.includes(e.id))
          D.add(...sel.map((e) => ({ ...mirror(e, last, p), id: undefined })))
          pts = []
        }
        break
    }
  }

  // ---------- eventos do ponteiro ----------
  const local = (ev) => {
    const r = canvas.getBoundingClientRect()
    return [ev.clientX - r.left, ev.clientY - r.top]
  }

  function pick(p) {
    const tol = 7 / D.view.k
    for (let i = D.ents.length - 1; i >= 0; i--) {
      const e = D.ents[i]
      if (D.visible(e) && hit(e, p, tol)) return e
    }
    return null
  }

  function onDown(ev) {
    canvas.setPointerCapture(ev.pointerId)
    pointers.set(ev.pointerId, local(ev))
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: D.view.k }
      box = null
      drag = null
      pan = null
      return
    }
    const [px, py] = local(ev)
    if (ev.button === 1 || ev.button === 2 || tool === 'pan' || space) {
      pan = { x: px, y: py, cx: D.view.cx, cy: D.view.cy, moved: false, right: ev.button === 2 }
      return
    }
    const raw = [wx(px), wy(py)]
    const s = computeSnap(raw)
    cur = s.p
    snap = s.k ? s : null
    if (tool === 'select') {
      const e = pick(raw)
      if (e) {
        if (ev.shiftKey) D.sel = D.sel.includes(e.id) ? D.sel.filter((i) => i !== e.id) : [...D.sel, e.id]
        else if (!D.sel.includes(e.id)) D.sel = [e.id]
        drag = { from: raw, d: [0, 0], moved: false }
      } else {
        if (!ev.shiftKey) D.sel = []
        box = { a: raw, b: raw }
      }
    } else click(s.p)
  }

  function onMove(ev) {
    const [px, py] = local(ev)
    if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, [px, py])
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      D.view.k = Math.min(Math.max(pinch.k * (Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d), 0.01), 1e6)
      return
    }
    if (pan) {
      const dx = px - pan.x
      const dy = py - pan.y
      if (Math.abs(dx) + Math.abs(dy) > 3) pan.moved = true
      D.view.cx = pan.cx - dx / D.view.k
      D.view.cy = pan.cy + dy / D.view.k
      return
    }
    const raw = [wx(px), wy(py)]
    if (drag) {
      drag.d = [raw[0] - drag.from[0], raw[1] - drag.from[1]]
      if (Math.abs(drag.d[0]) + Math.abs(drag.d[1]) > 4 / D.view.k) drag.moved = true
      cur = raw
      return
    }
    if (box) {
      box.b = raw
      cur = raw
      return
    }
    const s = computeSnap(raw)
    cur = s.p
    snap = s.k ? s : null
  }

  function onUp(ev) {
    pointers.delete(ev.pointerId)
    if (pointers.size < 2) pinch = null
    if (pan) {
      if (pan.right && !pan.moved) finish()
      pan = null
    }
    if (drag) {
      if (drag.moved) {
        const sel = D.ents.filter((e) => D.sel.includes(e.id))
        D.replaceMany(new Map(sel.map((e) => [e.id, translate(e, drag.d)])))
      }
      drag = null
    }
    if (box) {
      const b = { x1: Math.min(box.a[0], box.b[0]), y1: Math.min(box.a[1], box.b[1]), x2: Math.max(box.a[0], box.b[0]), y2: Math.max(box.a[1], box.b[1]) }
      if (b.x2 - b.x1 > 3 / D.view.k || b.y2 - b.y1 > 3 / D.view.k) {
        const ids = D.ents.filter((e) => D.visible(e) && inBox(e, b)).map((e) => e.id)
        D.sel = ev.shiftKey ? [...new Set([...D.sel, ...ids])] : ids
      }
      box = null
    }
  }

  function onWheel(ev) {
    ev.preventDefault()
    const [px, py] = local(ev)
    const before = [wx(px), wy(py)]
    D.view.k = Math.min(Math.max(D.view.k * (ev.deltaY < 0 ? 1.15 : 1 / 1.15), 0.01), 1e6)
    D.view.cx += before[0] - wx(px)
    D.view.cy += before[1] - wy(py)
  }

  function zoomExtents() {
    D.extents(W, H)
  }

  function onKey(ev) {
    const inField = ev.target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(ev.target.tagName)
    if (ev.key === ' ' && !inField) {
      space = true
      ev.preventDefault()
      return
    }
    if (ev.key === 'Escape') {
      cancel()
      cmd = ''
      cmdEl?.blur()
      return
    }
    if (ev.key === 'F8') (ev.preventDefault(), (D.ortho = !D.ortho))
    else if (ev.key === 'F9') (ev.preventDefault(), (D.snapGrid = !D.snapGrid))
    else if (ev.key === 'F3') (ev.preventDefault(), (D.snapObj = !D.snapObj))
    else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') (ev.preventDefault(), ev.shiftKey ? D.redo() : D.undo())
    else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'y') (ev.preventDefault(), D.redo())
    else if (!inField && (ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'a') (ev.preventDefault(), (D.sel = D.ents.filter((e) => D.visible(e)).map((e) => e.id)))
    else if (!inField && (ev.key === 'Delete' || ev.key === 'Backspace')) (ev.preventDefault(), D.removeSel())
    else if (!inField && ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) cmdEl?.focus()
  }
  const onKeyUp = (ev) => {
    if (ev.key === ' ') space = false
  }

  // ---------- desenho ----------
  function render() {
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
    }
    const c = canvas.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.clearRect(0, 0, W, H)
    const k = D.view.k
    void D.rev
    const css = getComputedStyle(document.documentElement)
    const fg = css.getPropertyValue('--fg').trim() || '#fafaf9'

    // grade
    let step = D.grid > 0 ? D.grid : 1
    while (step * k < 10) step *= step * k < 2 ? 10 : 5
    const x1 = wx(0)
    const x2 = wx(W)
    const y2 = wy(0)
    const y1 = wy(H)
    c.lineWidth = 1
    c.fillStyle = '#fafaf92e'
    for (let x = Math.floor(x1 / step) * step; x <= x2; x += step)
      for (let y = Math.floor(y1 / step) * step; y <= y2; y += step) c.fillRect(Math.round(sx(x)), Math.round(sy(y)), 1.2, 1.2)
    c.strokeStyle = '#fafaf938'
    c.beginPath()
    c.moveTo(sx(0), 0); c.lineTo(sx(0), H)
    c.moveTo(0, sy(0)); c.lineTo(W, sy(0))
    c.stroke()

    const colorOf = (e) => aciHex(D.layerOf(e.layer)?.color ?? 7)
    const drawEnt = (e, color, lw = 1.2, off = [0, 0]) => {
      const X = (x) => sx(x + off[0])
      const Y = (y) => sy(y + off[1])
      c.strokeStyle = color
      c.fillStyle = color
      c.lineWidth = lw
      c.beginPath()
      if (e.type === 'line') {
        c.moveTo(X(e.a[0]), Y(e.a[1])); c.lineTo(X(e.b[0]), Y(e.b[1]))
      } else if (e.type === 'pline') {
        e.pts.forEach((p, i) => (i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1]))))
        if (e.closed) c.closePath()
      } else if (e.type === 'circle') {
        c.arc(X(e.c[0]), Y(e.c[1]), e.r * k, 0, Math.PI * 2)
      } else if (e.type === 'arc') {
        const a0 = e.a0 * RAD
        let a1 = e.a1 * RAD
        if (norm360(e.a1 - e.a0) === 0) a1 = a0 + Math.PI * 2
        c.arc(X(e.c[0]), Y(e.c[1]), e.r * k, -a0, -a1, true)
      } else if (e.type === 'dim') {
        for (const [p, q] of segments(e)) {
          c.moveTo(X(p[0]), Y(p[1])); c.lineTo(X(q[0]), Y(q[1]))
        }
      }
      c.stroke()
      if (e.type === 'text') {
        const px = e.h * k
        if (px < 3) return
        c.save()
        c.translate(X(e.p[0]), Y(e.p[1]))
        c.rotate(-(e.rot ?? 0) * RAD)
        c.font = `${px}px 'Geist Variable', sans-serif`
        c.fillText(e.text, 0, 0)
        c.restore()
      }
      if (e.type === 'dim') {
        const g = dimGeom(e)
        const h = Math.max(g.L * 0.04, 0.02)
        const px = h * k
        // marcas a 45°
        for (const p of [g.a2, g.b2]) {
          const t = Math.min(h * 0.6, g.L / 4)
          c.beginPath()
          c.moveTo(X(p[0] - (g.u[0] + g.n[0]) * t / 1.4), Y(p[1] - (g.u[1] + g.n[1]) * t / 1.4))
          c.lineTo(X(p[0] + (g.u[0] + g.n[0]) * t / 1.4), Y(p[1] + (g.u[1] + g.n[1]) * t / 1.4))
          c.stroke()
        }
        if (px >= 3) {
          c.save()
          c.translate(X(g.m[0] + g.n[0] * h * 0.4), Y(g.m[1] + g.n[1] * h * 0.4))
          let a = g.ang
          if (a > 90 || a < -90) a += 180
          c.rotate(-a * RAD)
          c.textAlign = 'center'
          c.font = `${px}px 'Geist Variable', sans-serif`
          c.fillText((Math.round(g.L * 100) / 100).toLocaleString('pt-BR'), 0, 0)
          c.restore()
        }
      }
    }

    for (const e of D.ents) {
      if (!D.visible(e)) continue
      const selected = D.sel.includes(e.id)
      const moved = selected && drag?.moved ? drag.d : [0, 0]
      drawEnt(e, selected ? '#6aa8ff' : colorOf(e), selected ? 2 : 1.2, moved)
    }

    // pré-visualização
    const last = pts[pts.length - 1]
    const pv = '#fafaf9aa'
    const pe = { layer: D.layer }
    c.setLineDash([5, 4])
    if (last && cur) {
      if (tool === 'line' || tool === 'measure' || tool === 'move' || tool === 'copy' || tool === 'mirror') drawEnt({ ...pe, type: 'line', a: last, b: cur }, pv)
      if (tool === 'pline') drawEnt({ ...pe, type: 'pline', pts: [...pts, cur], closed: false }, pv)
      if (tool === 'rect') drawEnt({ ...pe, type: 'pline', pts: [last, [cur[0], last[1]], cur, [last[0], cur[1]]], closed: true }, pv)
      if (tool === 'circle') drawEnt({ ...pe, type: 'circle', c: last, r: dist(last, cur) }, pv)
      if (tool === 'arc') {
        if (pts.length === 1) drawEnt({ ...pe, type: 'line', a: pts[0], b: cur }, pv)
        else drawEnt({ ...pe, type: 'arc', c: pts[0], r: dist(pts[0], pts[1]), a0: angDeg(pts[0], pts[1]), a1: angDeg(pts[0], cur) }, pv)
      }
      if (tool === 'dim') {
        if (pts.length === 1) drawEnt({ ...pe, type: 'line', a: pts[0], b: cur }, pv)
        else {
          const L = dist(pts[0], pts[1]) || 1
          const off = ((pts[1][0] - pts[0][0]) * (cur[1] - pts[0][1]) - (pts[1][1] - pts[0][1]) * (cur[0] - pts[0][0])) / L
          drawEnt({ ...pe, type: 'dim', a: pts[0], b: pts[1], off }, pv)
        }
      }
      if (tool === 'rotate') drawEnt({ ...pe, type: 'line', a: pts[0], b: cur }, pv)
      if ((tool === 'move' || tool === 'copy') && D.sel.length) {
        const d = [cur[0] - last[0], cur[1] - last[1]]
        for (const e of D.ents) if (D.sel.includes(e.id)) drawEnt(e, '#6aa8ff88', 1.2, d)
      }
    }
    c.setLineDash([])
    if (box) {
      c.strokeStyle = '#6aa8ff'
      c.fillStyle = '#6aa8ff1a'
      c.lineWidth = 1
      const [a, b] = [box.a, box.b]
      c.fillRect(sx(a[0]), sy(a[1]), sx(b[0]) - sx(a[0]), sy(b[1]) - sy(a[1]))
      c.strokeRect(sx(a[0]), sy(a[1]), sx(b[0]) - sx(a[0]), sy(b[1]) - sy(a[1]))
    }
    // marcador de snap / cursor
    if (tool !== 'select' && tool !== 'pan' && cur) {
      c.strokeStyle = snap ? '#ffd54a' : fg
      c.lineWidth = 1.2
      const [mx, my] = [sx(cur[0]), sy(cur[1])]
      if (snap) {
        c.strokeRect(mx - 6, my - 6, 12, 12)
        c.fillStyle = '#ffd54a'
        c.font = '11px sans-serif'
        c.fillText(snap.k, mx + 10, my - 8)
      } else {
        c.beginPath()
        c.moveTo(mx - 6, my); c.lineTo(mx + 6, my)
        c.moveTo(mx, my - 6); c.lineTo(mx, my + 6)
        c.stroke()
      }
    }
  }

  $effect(() => {
    D.rev
    D.view.cx
    D.view.cy
    D.view.k
    D.sel
    D.grid
    D.layers.forEach((l) => l.visible && l.color)
    pts
    cur
    snap
    box
    drag?.d
    tool
    W
    H
    render()
  })

  onMount(() => {
    D.init().then(() => {
      if (D.ents.length && D.view.k === 40 && D.view.cx === 0 && D.view.cy === 0) D.extents(W, H)
    })
    const ro = new ResizeObserver(() => {
      W = Math.max(wrap.clientWidth, 100)
      H = Math.max(wrap.clientHeight, 100)
    })
    ro.observe(wrap)
    W = wrap.clientWidth
    H = wrap.clientHeight
    return () => ro.disconnect()
  })

  // ---------- arquivos ----------
  function baixar(nome, texto, tipo) {
    const url = URL.createObjectURL(new Blob([texto], { type: tipo }))
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function importar(ev) {
    const file = ev.currentTarget.files[0]
    ev.currentTarget.value = ''
    if (!file) return
    if (/\.dwg$/i.test(file.name)) {
      msg = 'DWG é um formato proprietário e não é lido aqui. Salve como DXF (AutoCAD: SALVAR COMO, ou LibreCAD / conversor gratuito) e importe o .dxf.'
      return
    }
    try {
      const r = lerDxf(await file.text())
      if (!r.ents.length) {
        msg = 'Nenhuma entidade reconhecida no arquivo. Suportado: linha, polilinha, círculo, arco e texto.'
        return
      }
      D.replaceAll(r.ents, r.layers)
      zoomExtents()
      const ign = Object.entries(r.ignorados).map(([k, v]) => `${v} ${k}`).join(', ')
      msg = `${r.ents.length} entidades importadas${ign ? `. Ignoradas (não suportadas): ${ign}` : ''}.`
    } catch {
      msg = 'Não foi possível ler o arquivo DXF.'
    }
  }
  const exportDxf = () => baixar('desenho.dxf', escreverDxf($state.snapshot(D.ents), $state.snapshot(D.layers)), 'application/dxf')
  const exportSvg = () => baixar('desenho.svg', escreverSvg($state.snapshot(D.ents), $state.snapshot(D.layers)), 'image/svg+xml')

  const info = $derived.by(() => {
    void D.rev
    const s = D.ents.filter((e) => D.sel.includes(e.id))
    if (!s.length) return ''
    if (s.length > 1) return `${s.length} objetos selecionados`
    const e = s[0]
    if (e.type === 'line') return `Linha · comprimento ${fmt(dist(e.a, e.b))} ${D.unidade} · ${fmt(norm360(angDeg(e.a, e.b)))}°`
    if (e.type === 'pline') return `Polilinha · perímetro ${fmt(polylineLength(e.pts, e.closed))} ${D.unidade}${e.closed ? ` · área ${fmt(polygonArea(e.pts))} ${D.unidade}²` : ''}`
    if (e.type === 'circle') return `Círculo · raio ${fmt(e.r)} · área ${fmt(Math.PI * e.r * e.r)} ${D.unidade}²`
    if (e.type === 'arc') return `Arco · raio ${fmt(e.r)} · ${fmt(norm360(e.a1 - e.a0))}°`
    if (e.type === 'dim') return `Cota · ${fmt(dist(e.a, e.b))} ${D.unidade}`
    return `Texto · “${e.text}”`
  })
</script>

<svelte:window onkeydown={onKey} onkeyup={onKeyUp} />

<div class="cad card">
  <div class="bar">
    <div class="tools" role="toolbar" aria-label="Ferramentas de desenho">
      {#each FERRAMENTAS as [id, nome, atalho]}
        <button class="tbtn" class:on={tool === id} onclick={() => setTool(id)} title="{nome} ({atalho})">{nome}</button>
      {/each}
    </div>
    <div class="opts-row">
      <label class="lay"><span>Camada</span>
        <select bind:value={D.layer}>{#each D.layers as l (l.name)}<option>{l.name}</option>{/each}</select>
      </label>
      <button class="btn sm" onclick={() => (layersOpen = !layersOpen)}>Camadas</button>
      <button class="btn sm" class:act={D.ortho} onclick={() => (D.ortho = !D.ortho)} title="F8">Ortho</button>
      <button class="btn sm" class:act={D.snapGrid} onclick={() => (D.snapGrid = !D.snapGrid)} title="F9">Grade</button>
      <button class="btn sm" class:act={D.snapObj} onclick={() => (D.snapObj = !D.snapObj)} title="F3">Objetos</button>
      <button class="btn sm" onclick={() => D.undo()} title="Ctrl Z">Desfazer</button>
      <button class="btn sm" onclick={() => D.redo()} title="Ctrl Y">Refazer</button>
      <button class="btn sm" onclick={zoomExtents}>Ajustar</button>
      <button class="btn sm" onclick={() => fileEl.click()}>Importar DXF</button>
      <button class="btn sm" onclick={exportDxf}>DXF</button>
      <button class="btn sm" onclick={exportSvg}>SVG</button>
    </div>
  </div>

  <div class="stage" bind:this={wrap}>
    <canvas
      bind:this={canvas}
      style="width:{W}px;height:{H}px;cursor:{tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair'}"
      onpointerdown={onDown}
      onpointermove={onMove}
      onpointerup={onUp}
      onpointercancel={onUp}
      onwheel={onWheel}
      ondblclick={() => tool === 'pline' && finish()}
      oncontextmenu={(e) => e.preventDefault()}
    ></canvas>

    {#if layersOpen}
      <div class="layers card" role="dialog" aria-label="Camadas">
        {#each D.layers as l (l.name)}
          <div class="lrow">
            <input type="checkbox" checked={l.visible !== false} onchange={(e) => D.setLayerProp(l.name, 'visible', e.currentTarget.checked)} aria-label="Visível" />
            <span class="sw" style="background:{aciHex(l.color)}"></span>
            <button class="lname" class:cur={D.layer === l.name} onclick={() => (D.layer = l.name)}>{l.name}</button>
            <select value={l.color} onchange={(e) => D.setLayerProp(l.name, 'color', Number(e.currentTarget.value))} aria-label="Cor">
              {#each [1, 2, 3, 4, 5, 6, 7] as n}<option value={n}>cor {n}</option>{/each}
            </select>
          </div>
        {/each}
        <form class="lrow" onsubmit={(e) => (e.preventDefault(), D.addLayer(newLayer) && (newLayer = ''))}>
          <input class="lin" placeholder="Nova camada" bind:value={newLayer} />
          <button class="btn sm" type="submit">Criar</button>
        </form>
        <button class="btn sm" onclick={() => D.moveSelToLayer()} disabled={!D.sel.length}>Mover seleção para a camada atual</button>
      </div>
    {/if}
  </div>

  <div class="cmdbar">
    <span class="hint">{hint}</span>
    <form onsubmit={(e) => (e.preventDefault(), onCommand())}>
      <input bind:this={cmdEl} bind:value={cmd} placeholder="Comando ou ponto: 3;4 · @2;0 · @5&lt;45 · 2,5 (distância)" autocomplete="off" spellcheck="false" aria-label="Linha de comando" />
    </form>
    <span class="coords tn">{fmt(cur[0])}, {fmt(cur[1])} {D.unidade}</span>
  </div>
  {#if msg || info}<div class="msg" role="status">{msg || info}</div>{/if}
</div>

<input bind:this={fileEl} type="file" accept=".dxf,.dwg" hidden onchange={importar} />

<style>
  .cad {
    height: 100%;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    overflow: hidden;
  }
  .bar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--line);
  }
  .tools,
  .opts-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }
  .tbtn {
    height: 28px;
    padding: 0 10px;
    border: 0;
    border-radius: 100px;
    background: none;
    color: var(--fg-3);
    font: 500 12px / 1 var(--sans);
    cursor: pointer;
  }
  .tbtn:hover {
    color: var(--fg);
  }
  .tbtn.on {
    background: #fafaf924;
    box-shadow: inset 0 0 0 1px #fafaf91f;
    color: var(--fg);
  }
  .btn.sm {
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
  }
  .btn.act {
    background: #6aa8ff33;
    border-color: #6aa8ff88;
  }
  .lay {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--fg-4);
    font-size: 12px;
    margin-right: 6px;
  }
  select {
    height: 28px;
    border: 1px solid var(--line-2);
    border-radius: 8px;
    background: #15141299;
    padding: 0 6px;
  }
  select option {
    background: var(--panel-2);
  }
  .stage {
    position: relative;
    min-height: 0;
    overflow: hidden;
  }
  canvas {
    display: block;
    touch-action: none;
  }
  .layers {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 280px;
    padding: 10px;
    display: grid;
    gap: 6px;
    background: var(--panel-2);
  }
  .lrow {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sw {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .lname {
    flex: 1;
    text-align: left;
    border: 0;
    background: none;
    cursor: pointer;
    color: var(--fg-2);
    padding: 4px 0;
  }
  .lname.cur {
    color: var(--fg);
    font-weight: 600;
  }
  .lin {
    flex: 1;
    min-width: 0;
    height: 28px;
    border: 1px solid var(--line-2);
    border-radius: 8px;
    background: none;
    padding: 0 8px;
  }
  .cmdbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) auto;
    gap: 12px;
    align-items: center;
    padding: 8px 12px;
    border-top: 1px solid var(--line);
    font-size: 12px;
  }
  .hint {
    color: var(--fg-4);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cmdbar input {
    width: 100%;
    height: 30px;
    border: 1px solid var(--line-2);
    border-radius: 8px;
    background: #15141299;
    padding: 0 10px;
    outline: 0;
  }
  .cmdbar input:focus {
    border-color: var(--line-3);
  }
  .coords {
    color: var(--fg-3);
  }
  .msg {
    padding: 6px 12px 10px;
    color: var(--fg-2);
    font-size: 12px;
  }
  @media (max-width: 700px) {
    .cmdbar {
      grid-template-columns: 1fr;
    }
    .hint {
      white-space: normal;
    }
  }
</style>
