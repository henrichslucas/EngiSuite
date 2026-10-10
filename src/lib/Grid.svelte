<script>
  import { onMount, tick, untrack } from 'svelte'
  import { RH, HH as H, GW as G, MAXR, MAXC, colName, show, clamp } from './util.js'

  let { wb } = $props()

  let scroller
  let canvas
  let ctx
  let raf = 0
  let dpr = 1
  let C = {}
  let drag = null
  let vw = $state(800)
  let vh = $state(500)
  let rows = $state(1000)
  let cols = $state(60)

  const colX = $derived.by(() => {
    wb.widthRev
    wb.active
    const a = new Float64Array(cols + 1)
    for (let i = 0; i < cols; i++) a[i + 1] = a[i] + wb.colWidth(i)
    return a
  })
  const totalW = $derived(G + colX[cols])
  const totalH = $derived(H + rows * RH)
  const ed = $derived(
    wb.edit && wb.edit.mode !== 'bar'
      ? { x: G + colX[wb.sel.ac], y: H + wb.sel.ar * RH, w: Math.max(wb.colWidth(wb.sel.ac), 140) }
      : null
  )
  const live = $derived.by(() => {
    wb.rev
    return `${wb.label}: ${show(wb.cellValue(wb.sel.ar, wb.sel.ac))}`
  })

  function colAt(x) {
    let lo = 0
    let hi = cols - 1
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1
      if (colX[m] <= x) lo = m
      else hi = m - 1
    }
    return lo
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(draw)
  }

  function draw() {
    raf = 0
    if (!ctx) return
    const w = vw
    const h = vh
    const sx = scroller.scrollLeft
    const sy = scroller.scrollTop
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const r0 = Math.max(0, Math.floor(sy / RH))
    const r1 = Math.min(rows - 1, Math.floor((sy + h - H) / RH))
    const c0 = colAt(sx)
    const c1 = colAt(sx + w - G)

    ctx.save()
    ctx.beginPath()
    ctx.rect(G, H, w - G, h - H)
    ctx.clip()

    ctx.lineWidth = 1
    ctx.strokeStyle = C.line
    ctx.beginPath()
    for (let c = c0; c <= c1 + 1; c++) {
      const x = Math.round(G + colX[c] - sx) + 0.5
      ctx.moveTo(x, H)
      ctx.lineTo(x, h)
    }
    for (let r = r0; r <= r1 + 1; r++) {
      const y = Math.round(H + r * RH - sy) + 0.5
      ctx.moveTo(G, y)
      ctx.lineTo(w, y)
    }
    ctx.stroke()

    ctx.font = C.font
    ctx.textBaseline = 'middle'
    for (let r = r0; r <= r1; r++) {
      const y0 = H + r * RH - sy
      for (let c = c0; c <= c1; c++) {
        const v = wb.cellValue(r, c)
        if (v == null || v === '') continue
        const t = show(v)
        const x0 = G + colX[c] - sx
        const cw = colX[c + 1] - colX[c]
        ctx.fillStyle = typeof v === 'object' ? C.fg3 : C.fg
        const ty = y0 + RH / 2 + 0.5
        if (ctx.measureText(t).width > cw - 14) {
          ctx.save()
          ctx.beginPath()
          ctx.rect(x0, y0, cw, RH)
          ctx.clip()
          ctx.textAlign = 'left'
          ctx.fillText(t, x0 + 7, ty)
          ctx.restore()
        } else if (typeof v === 'number') {
          ctx.textAlign = 'right'
          ctx.fillText(t, x0 + cw - 7, ty)
        } else {
          ctx.textAlign = 'left'
          ctx.fillText(t, x0 + 7, ty)
        }
      }
    }

    const b = wb.box
    const s = wb.sel
    const x1 = G + colX[b.c1] - sx
    const x2 = G + colX[b.c2 + 1] - sx
    const y1 = H + b.r1 * RH - sy
    const y2 = H + (b.r2 + 1) * RH - sy
    if (wb.multi) {
      ctx.fillStyle = C.sel
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
      ctx.lineWidth = 1
      ctx.strokeStyle = C.line3
      ctx.strokeRect(x1 + 0.5, y1 + 0.5, x2 - x1 - 1, y2 - y1 - 1)
    }
    const ax = G + colX[s.ac] - sx
    const ay = H + s.ar * RH - sy
    ctx.lineWidth = 2
    ctx.strokeStyle = C.fg
    ctx.strokeRect(ax + 1, ay + 1, colX[s.ac + 1] - colX[s.ac] - 2, RH - 2)
    ctx.restore()

    ctx.fillStyle = C.head
    ctx.fillRect(0, 0, w, H)
    ctx.fillRect(0, 0, G, h)
    ctx.font = C.hfont
    ctx.textAlign = 'center'

    ctx.save()
    ctx.beginPath()
    ctx.rect(G, 0, w - G, H)
    ctx.clip()
    for (let c = c0; c <= c1; c++) {
      const x0 = G + colX[c] - sx
      const cw = colX[c + 1] - colX[c]
      const on = c >= b.c1 && c <= b.c2
      if (on) {
        ctx.fillStyle = C.sel
        ctx.fillRect(x0, 0, cw, H)
      }
      ctx.fillStyle = on ? C.fg : C.fg3
      ctx.fillText(colName(c), x0 + cw / 2, H / 2 + 0.5)
      ctx.fillStyle = C.line
      ctx.fillRect(Math.round(x0 + cw) - 1, 0, 1, H)
    }
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, H, G, h - H)
    ctx.clip()
    for (let r = r0; r <= r1; r++) {
      const y0 = H + r * RH - sy
      const on = r >= b.r1 && r <= b.r2
      if (on) {
        ctx.fillStyle = C.sel
        ctx.fillRect(0, y0, G, RH)
      }
      ctx.fillStyle = on ? C.fg : C.fg4
      ctx.fillText(String(r + 1), G / 2, y0 + RH / 2 + 0.5)
      ctx.fillStyle = C.line
      ctx.fillRect(0, Math.round(y0 + RH) - 1, G, 1)
    }
    ctx.restore()

    ctx.fillStyle = C.line2
    ctx.fillRect(0, H - 1, w, 1)
    ctx.fillRect(G - 1, 0, 1, h)
  }

  function sizeCanvas() {
    vw = scroller.clientWidth
    vh = scroller.clientHeight
    dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(vw * dpr)
    canvas.height = Math.round(vh * dpr)
    canvas.style.width = vw + 'px'
    canvas.style.height = vh + 'px'
    schedule()
  }

  function ensureSize(r, c) {
    let grew = false
    if (r >= rows - 30 && rows < MAXR) {
      rows = Math.min(MAXR, Math.max(rows + 500, r + 100))
      grew = true
    }
    if (c >= cols - 6 && cols < MAXC) {
      cols = Math.min(MAXC, Math.max(cols + 26, c + 20))
      grew = true
    }
    return grew
  }

  function doReveal(r, c) {
    const sx = scroller.scrollLeft
    const sy = scroller.scrollTop
    const left = colX[c]
    const right = colX[c + 1]
    if (left < sx) scroller.scrollLeft = left
    else if (G + right > sx + vw) scroller.scrollLeft = G + right - vw
    const top = r * RH
    const bottom = H + (r + 1) * RH
    if (top < sy) scroller.scrollTop = top
    else if (bottom > sy + vh) scroller.scrollTop = bottom - vh
    schedule()
  }

  function reveal(r, c) {
    if (ensureSize(r, c)) tick().then(() => doReveal(r, c))
    else doReveal(r, c)
  }

  function onScroll() {
    const last = Math.floor((scroller.scrollTop + vh - H) / RH)
    const lastC = colAt(scroller.scrollLeft + vw - G)
    ensureSize(last, lastC)
    schedule()
  }

  function hit(e) {
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const sx = scroller.scrollLeft
    const sy = scroller.scrollTop
    const x = px - G + sx
    const c = colAt(x)
    const r = clamp(Math.floor((py - H + sy) / RH), 0, rows - 1)
    if (px < G && py < H) return { k: 'corner', px, py }
    if (py < H && px >= G) {
      if (colX[c + 1] - x <= 4) return { k: 'resize', c, px, py }
      if (x - colX[c] <= 4 && c > 0) return { k: 'resize', c: c - 1, px, py }
      return { k: 'col', c, px, py }
    }
    if (px < G) return { k: 'row', r, px, py }
    return { k: 'cell', r, c: Math.max(0, c), px, py }
  }

  let tapEdit = null

  function onPointerDown(e) {
    if (e.button !== 0) return
    wb.commitEdit()
    const h = hit(e)
    // toque numa célula que já estava selecionada (sem arrastar) entra em edição
    tapEdit = e.pointerType === 'touch' && h.k === 'cell' && !wb.multi && wb.sel.ar === h.r && wb.sel.ac === h.c ? { r: h.r, c: h.c } : null
    canvas.setPointerCapture(e.pointerId)
    const s = wb.sel
    if (h.k === 'corner') {
      wb.select(0, 0, rows - 1, cols - 1)
    } else if (h.k === 'resize') {
      drag = { k: 'resize', c: h.c, x: e.clientX, w: wb.colWidth(h.c) }
    } else if (h.k === 'col') {
      if (e.shiftKey) s.fc = h.c
      else wb.select(0, h.c, rows - 1, h.c)
      s.fr = rows - 1
      drag = { k: 'col' }
    } else if (h.k === 'row') {
      if (e.shiftKey) s.fr = h.r
      else wb.select(h.r, 0, h.r, cols - 1)
      s.fc = cols - 1
      drag = { k: 'row' }
    } else {
      if (e.shiftKey) {
        s.fr = h.r
        s.fc = h.c
      } else wb.select(h.r, h.c, h.r, h.c)
      drag = { k: 'cell' }
    }
    scroller.focus({ preventScroll: true })
    e.preventDefault()
  }

  function onPointerMove(e) {
    if (!drag) {
      const h = hit(e)
      canvas.style.cursor = h.k === 'resize' ? 'col-resize' : 'default'
      return
    }
    if (drag.k === 'resize') {
      wb.setWidth(drag.c, Math.max(40, Math.round(drag.w + e.clientX - drag.x)))
      return
    }
    const h = hit(e)
    const s = wb.sel
    if (drag.k === 'cell') {
      s.fr = h.r ?? s.fr
      s.fc = h.c ?? s.fc
      if (h.py > vh - 24) scroller.scrollTop += RH
      else if (h.py < H + 24) scroller.scrollTop -= RH
      if (h.px > vw - 40) scroller.scrollLeft += 60
      else if (h.px < G + 40) scroller.scrollLeft -= 60
      ensureSize(s.fr, s.fc)
    } else if (drag.k === 'col' && h.c != null) s.fc = h.c
    else if (drag.k === 'row' && h.r != null) s.fr = h.r
  }

  function onPointerUp(e) {
    if (drag?.k === 'resize') wb.touch()
    drag = null
    if (tapEdit && e.type === 'pointerup') {
      wb.startEdit('edit', wb.raw(tapEdit.r, tapEdit.c))
    }
    tapEdit = null
  }

  function onDblClick(e) {
    const h = hit(e)
    if (h.k === 'cell') {
      wb.select(h.r, h.c, h.r, h.c)
      wb.startEdit('edit', wb.raw(h.r, h.c))
    }
  }

  function jump(r, c, dr, dc) {
    const d = wb.dims
    const filled = (rr, cc) => {
      const v = wb.cellValue(rr, cc)
      return v != null && v !== ''
    }
    const inb = (a, b) => a >= 0 && b >= 0 && a < MAXR && b < MAXC
    const nr = r + dr
    const nc = c + dc
    if (!inb(nr, nc)) return [r, c]
    let rr = r
    let cc = c
    if (filled(r, c) && filled(nr, nc)) {
      while (inb(rr + dr, cc + dc) && filled(rr + dr, cc + dc)) {
        rr += dr
        cc += dc
      }
      return [rr, cc]
    }
    rr = nr
    cc = nc
    while (!filled(rr, cc)) {
      const pr = rr + dr
      const pc = cc + dc
      if (pr < 0 || pc < 0 || pr >= Math.max(d.height, 1) || pc >= Math.max(d.width, 1)) break
      rr = pr
      cc = pc
    }
    return [rr, cc]
  }

  function move(dr, dc, ext, ctrl) {
    const s = wb.sel
    let r = ext ? s.fr : s.ar
    let c = ext ? s.fc : s.ac
    if (ctrl) [r, c] = jump(r, c, dr, dc)
    else {
      r += dr
      c += dc
    }
    r = clamp(r, 0, MAXR - 1)
    c = clamp(c, 0, MAXC - 1)
    ensureSize(r, c)
    if (ext) {
      s.fr = r
      s.fc = c
    } else wb.select(r, c, r, c)
    reveal(r, c)
  }

  const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }

  function onKeyDown(e) {
    if (wb.edit || e.target !== scroller) return
    const mod = e.ctrlKey || e.metaKey
    const k = e.key
    if (arrows[k]) {
      e.preventDefault()
      move(arrows[k][0], arrows[k][1], e.shiftKey, mod)
    } else if (k === 'Tab') {
      e.preventDefault()
      move(0, e.shiftKey ? -1 : 1, false, false)
    } else if (k === 'Enter') {
      e.preventDefault()
      if (mod) wb.startEdit('edit', wb.raw(wb.sel.ar, wb.sel.ac))
      else move(e.shiftKey ? -1 : 1, 0, false, false)
    } else if (k === 'F2') {
      e.preventDefault()
      wb.startEdit('edit', wb.raw(wb.sel.ar, wb.sel.ac))
    } else if (k === 'Delete' || k === 'Backspace') {
      e.preventDefault()
      wb.clearSel()
    } else if (k === 'Home') {
      e.preventDefault()
      if (mod) wb.select(0, 0, 0, 0)
      else wb.select(wb.sel.ar, 0, wb.sel.ar, 0)
      reveal(mod ? 0 : wb.sel.ar, 0)
    } else if (k === 'PageDown' || k === 'PageUp') {
      e.preventDefault()
      const n = Math.max(1, Math.floor((vh - H) / RH) - 1)
      move(k === 'PageDown' ? n : -n, 0, e.shiftKey, false)
    } else if (k === 'Escape') {
      wb.hf.clearClipboard()
    } else if (mod && k.toLowerCase() === 'z') {
      e.preventDefault()
      if (e.shiftKey) wb.redo()
      else wb.undo()
    } else if (mod && k.toLowerCase() === 'y') {
      e.preventDefault()
      wb.redo()
    } else if (mod && k.toLowerCase() === 'a') {
      e.preventDefault()
      wb.select(0, 0, rows - 1, cols - 1)
    } else if (!mod && !e.altKey && k.length === 1) {
      e.preventDefault()
      wb.startEdit('type', k)
    }
  }

  function editKey(e) {
    e.stopPropagation()
    const k = e.key
    if (k === 'Enter') {
      e.preventDefault()
      wb.commitEdit(e.shiftKey ? -1 : 1, 0)
      scroller.focus({ preventScroll: true })
    } else if (k === 'Tab') {
      e.preventDefault()
      wb.commitEdit(0, e.shiftKey ? -1 : 1)
      scroller.focus({ preventScroll: true })
    } else if (k === 'Escape') {
      e.preventDefault()
      wb.cancelEdit()
      scroller.focus({ preventScroll: true })
    } else if (wb.edit?.mode === 'type' && arrows[k]) {
      e.preventDefault()
      wb.commitEdit(arrows[k][0], arrows[k][1])
      scroller.focus({ preventScroll: true })
    }
  }

  function editBlur() {
    if (wb.edit && wb.edit.mode !== 'bar') wb.commitEdit()
  }

  function mountInput(node) {
    node.focus()
    const n = node.value.length
    node.setSelectionRange(n, n)
  }

  function onCopy(e) {
    if (wb.edit || e.target !== scroller) return
    e.preventDefault()
    e.clipboardData.setData('text/plain', wb.copySel(false))
  }

  function onCut(e) {
    if (wb.edit || e.target !== scroller) return
    e.preventDefault()
    e.clipboardData.setData('text/plain', wb.copySel(true))
  }

  function onPaste(e) {
    if (wb.edit || e.target !== scroller) return
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    e.preventDefault()
    wb.pasteText(text)
    ensureSize(wb.box.r2, wb.box.c2)
  }

  onMount(() => {
    ctx = canvas.getContext('2d')
    const css = getComputedStyle(document.documentElement)
    const v = (n) => css.getPropertyValue(n).trim()
    const sans = v('--sans')
    C = {
      line: v('--line'),
      line2: v('--line-2'),
      line3: v('--line-3'),
      fg: v('--fg'),
      fg3: v('--fg-3'),
      fg4: v('--fg-4'),
      head: v('--panel-2'),
      sel: 'rgba(250,250,249,0.07)',
      font: `400 13px ${sans}`,
      hfont: `500 12px ${sans}`
    }
    wb.focusGrid = () => scroller.focus({ preventScroll: true })
    wb.reveal = reveal
    const ro = new ResizeObserver(sizeCanvas)
    ro.observe(scroller)
    sizeCanvas()
    document.fonts.load(`400 13px ${sans}`).then(schedule)
    document.fonts.ready.then(schedule)
    scroller.focus({ preventScroll: true })
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  })

  $effect(() => {
    wb.rev
    wb.widthRev
    wb.active
    wb.sel.ar
    wb.sel.ac
    wb.sel.fr
    wb.sel.fc
    colX
    vw
    vh
    schedule()
  })

  $effect(() => {
    wb.active
    untrack(() => {
      const d = wb.dims
      ensureSize(d.height + 30, d.width + 3)
      if (scroller) scroller.scrollTo(0, 0)
    })
  })

  $effect(() => {
    wb.rev
    untrack(() => {
      const d = wb.dims
      ensureSize(d.height + 30, d.width + 3)
    })
  })
</script>

<div class="host card enter" style="animation-delay: 140ms">
  <div
    class="scroller"
    bind:this={scroller}
    role="grid"
    tabindex="0"
    aria-label="Planilha"
    onscroll={onScroll}
    onkeydown={onKeyDown}
    oncopy={onCopy}
    oncut={onCut}
    onpaste={onPaste}
  >
    <div class="sizer" style="width: {totalW}px; height: {totalH}px">
      <canvas
        bind:this={canvas}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
        ondblclick={onDblClick}
      ></canvas>
      {#if ed}
        <input
          class="cell-input"
          type="text"
          spellcheck="false"
          autocomplete="off"
          aria-label="Editar célula"
          style="left: {ed.x}px; top: {ed.y}px; width: {ed.w}px; height: {RH}px"
          value={wb.edit.text}
          oninput={(e) => (wb.edit.text = e.currentTarget.value)}
          onkeydown={editKey}
          onblur={editBlur}
          use:mountInput
        />
      {/if}
    </div>
  </div>
  <div class="sr" aria-live="polite">{live}</div>
</div>

<style>
  .host {
    position: relative;
    min-height: 0;
    overflow: hidden;
  }

  .scroller {
    position: absolute;
    inset: 0;
    overflow: auto;
    outline: none;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--line-2) transparent;
  }

  .sizer {
    position: relative;
  }

  canvas {
    position: sticky;
    top: 0;
    left: 0;
    display: block;
  }

  .cell-input {
    position: absolute;
    z-index: 2;
    min-width: 0;
    padding: 0 6px;
    border: 2px solid var(--fg);
    border-radius: 4px;
    outline: 0;
    background: var(--panel-3);
    font: 400 13px / 1 var(--sans);
  }
</style>
