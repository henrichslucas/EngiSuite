<script>
  import { onMount } from 'svelte'
  import { CATALOGO, GRUPOS } from './catalog.js'
  import { caixa, colisoes, limitar, novoItem, ocupacao, grade } from './layout.js'
  import { load, save } from '../lib/store.js'
  import { drawing } from '../cad/doc.svelte.js'
  import { bbox } from '../cad/geom.js'

  const KEY = 'room3d-v1'
  let canvas
  let wrap
  let fileEl
  let cena = $state.raw(null)
  let erro = $state('')
  let sala = $state({ w: 4.5, d: 3.5, h: 2.7, cParede: '#e9e5de', cPiso: '#b8a58c' })
  let itens = $state([])
  let sel = $state(null)
  let gradeM = $state(0.05)
  let paredes = $state('auto')
  let ortho = $state(false)
  let msg = $state('')
  let pronto = false
  let timer = 0

  const item = $derived(itens.find((i) => i.id === sel) ?? null)
  const cols = $derived(colisoes(itens))
  const ocup = $derived(ocupacao(itens, sala))
  const lista = $derived.by(() => {
    const m = new Map()
    for (const i of itens) {
      const k = `${i.tipo}|${i.w}|${i.d}|${i.h}`
      m.set(k, { nome: CATALOGO[i.tipo].nome, w: i.w, d: i.d, h: i.h, n: (m.get(k)?.n ?? 0) + 1 })
    }
    return [...m.values()]
  })

  const f2 = (n) => (Math.round(n * 100) / 100).toLocaleString('pt-BR')

  function salvar() {
    clearTimeout(timer)
    timer = setTimeout(() => save(KEY, { sala: $state.snapshot(sala), itens: $state.snapshot(itens) }).catch(() => {}), 500)
  }

  function atualizar(id, patch) {
    itens = itens.map((i) => (i.id === id ? { ...i, ...patch } : i))
    salvar()
  }

  function adicionar(tipo) {
    let it = novoItem(tipo, sala)
    // desloca para não empilhar exatamente sobre outro
    const n = itens.length
    it = limitar({ ...it, x: it.x + ((n % 5) - 2) * 0.15, z: it.z + ((n % 3) - 1) * 0.15 }, sala)
    itens = [...itens, it]
    sel = it.id
    salvar()
  }

  function remover() {
    if (!item) return
    itens = itens.filter((i) => i.id !== sel)
    sel = null
    salvar()
  }

  function duplicar() {
    if (!item) return
    const c = limitar({ ...item, id: novoItem(item.tipo, sala).id, x: item.x + 0.3, z: item.z + 0.3 }, sala)
    itens = [...itens, c]
    sel = c.id
    salvar()
  }

  function girar(g) {
    if (!item) return
    const rot = (((item.rot + g) % 360) + 360) % 360
    atualizar(item.id, limitar({ ...item, rot }, sala))
  }

  // encosta o fundo do móvel na parede mais próxima
  function encostar() {
    if (!item) return
    const b = caixa(item)
    const dist = { norte: b.z1, sul: sala.d - b.z2, oeste: b.x1, leste: sala.w - b.x2 }
    const [lado] = Object.entries(dist).sort((p, q) => p[1] - q[1])[0]
    const rot = { norte: 0, sul: 180, oeste: 270, leste: 90 }[lado]
    atualizar(item.id, limitar({ ...item, rot, ...(lado === 'norte' ? { z: 0 } : lado === 'sul' ? { z: sala.d } : lado === 'oeste' ? { x: 0 } : { x: sala.w }) }, sala))
  }

  function dimensao(campo, v) {
    const n = Number(String(v).replace(',', '.'))
    if (!item || !Number.isFinite(n) || n <= 0) return
    atualizar(item.id, limitar({ ...item, [campo]: campo === 'elev' ? Math.max(n, 0) : n }, sala))
  }

  function mudarSala(campo, v) {
    const n = Number(String(v).replace(',', '.'))
    if (!Number.isFinite(n) || n < 1 || n > 30) return
    sala = { ...sala, [campo]: n }
    itens = itens.map((i) => limitar(i, sala))
    salvar()
  }

  function doDesenho() {
    const e = drawing.ents.find((x) => drawing.sel.includes(x.id)) ?? null
    const b = e ? bbox(e) : null
    if (!b) {
      msg = 'No módulo de desenho 2D, selecione uma polilinha fechada (o contorno do cômodo).'
      return
    }
    const fator = drawing.unidade === 'cm' ? 0.01 : drawing.unidade === 'mm' ? 0.001 : 1
    const w = (b.x2 - b.x1) * fator
    const d = (b.y2 - b.y1) * fator
    if (w < 1 || d < 1 || w > 30 || d > 30) {
      msg = `Dimensões fora do intervalo (${f2(w)} × ${f2(d)} m). Ajuste a unidade do desenho.`
      return
    }
    sala = { ...sala, w: Math.round(w * 100) / 100, d: Math.round(d * 100) / 100 }
    itens = itens.map((i) => limitar(i, sala))
    msg = `Cômodo ajustado para ${f2(sala.w)} × ${f2(sala.d)} m.`
    salvar()
  }

  function onKey(ev) {
    const campo = ev.target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(ev.target.tagName)
    if (campo || !item) return
    const passo = ev.shiftKey ? 0.01 : 0.05
    if (ev.key === 'Delete' || ev.key === 'Backspace') (ev.preventDefault(), remover())
    else if (ev.key.toLowerCase() === 'r') girar(ev.shiftKey ? -90 : 90)
    else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'd') (ev.preventDefault(), duplicar())
    else if (ev.key.startsWith('Arrow')) {
      ev.preventDefault()
      const d = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[ev.key]
      atualizar(item.id, limitar({ ...item, x: item.x + d[0], z: item.z + d[1] }, sala))
    } else if (ev.key === 'Escape') sel = null
  }

  function baixar(nome, url) {
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    a.click()
  }
  const exportarPng = () => cena && baixar('comodo.png', cena.captura())
  const exportarJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ sala: $state.snapshot(sala), itens: $state.snapshot(itens) }, null, 1)], { type: 'application/json' }))
    baixar('comodo.json', url)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function importarJson(ev) {
    const file = ev.currentTarget.files[0]
    ev.currentTarget.value = ''
    if (!file) return
    try {
      const j = JSON.parse(await file.text())
      if (!j.sala || !Array.isArray(j.itens)) throw new Error()
      sala = { ...sala, ...j.sala }
      itens = j.itens.filter((i) => CATALOGO[i.tipo])
      sel = null
      salvar()
    } catch {
      msg = 'Arquivo inválido.'
    }
  }
  async function copiarLista() {
    const t = lista.map((l) => `${l.n}x ${l.nome} ${f2(l.w)} × ${f2(l.d)} × ${f2(l.h)} m`).join('\n')
    try {
      await navigator.clipboard.writeText(`Cômodo ${f2(sala.w)} × ${f2(sala.d)} × ${f2(sala.h)} m\n${t}`)
      msg = 'Lista copiada.'
    } catch {}
  }

  $effect(() => {
    if (!cena) return
    cena.setSala($state.snapshot(sala))
  })
  $effect(() => {
    if (!cena) return
    cena.setItens($state.snapshot(itens), sel, cols)
  })
  $effect(() => {
    cena?.setGrade(gradeM)
    cena?.setParedes(paredes)
    cena?.setOrtho(ortho)
  })

  onMount(() => {
    let ro
    let vivo = true
    ;(async () => {
      try {
        const s = await load(KEY).catch(() => null)
        if (s?.sala) sala = { ...sala, ...s.sala }
        if (s?.itens) itens = s.itens.filter((i) => CATALOGO[i.tipo])
        else {
          itens = [novoItem('sofa', sala), novoItem('mesaCentro', sala), novoItem('rackTv', sala)].map((i, k) => ({ ...i, x: [2.2, 2.2, 2.2][k], z: [2.7, 1.75, 0.3][k], rot: [180, 0, 0][k] }))
        }
        const { Cena } = await import('./scene3d.js')
        if (!vivo) return
        cena = new Cena(canvas, {
          onSelect: (id) => (sel = id),
          onDrag: (id, x, z) => {
            itens = itens.map((i) => (i.id === id ? { ...i, x, z } : i))
          },
          onDragEnd: () => salvar()
        })
        ro = new ResizeObserver(() => cena.tamanho(wrap.clientWidth, wrap.clientHeight))
        ro.observe(wrap)
        cena.tamanho(wrap.clientWidth, wrap.clientHeight)
        pronto = true
      } catch (e) {
        erro = 'Não foi possível iniciar o 3D (WebGL indisponível neste dispositivo).'
      }
    })()
    return () => {
      vivo = false
      ro?.disconnect()
      cena?.dispose()
      cena = null
    }
  })
</script>

<svelte:window onkeydown={onKey} />

<div class="v3d">
  <aside class="side card">
    <section>
      <h3>Cômodo (m)</h3>
      <div class="g3">
        <label>Larg.<input value={sala.w} onchange={(e) => mudarSala('w', e.currentTarget.value)} inputmode="decimal" /></label>
        <label>Prof.<input value={sala.d} onchange={(e) => mudarSala('d', e.currentTarget.value)} inputmode="decimal" /></label>
        <label>Altura<input value={sala.h} onchange={(e) => mudarSala('h', e.currentTarget.value)} inputmode="decimal" /></label>
      </div>
      <div class="g3">
        <label>Parede<input type="color" bind:value={sala.cParede} onchange={salvar} /></label>
        <label>Piso<input type="color" bind:value={sala.cPiso} onchange={salvar} /></label>
        <button class="btn sm" onclick={doDesenho} title="Usa a caixa envolvente do objeto selecionado no desenho 2D">Do desenho 2D</button>
      </div>
      <p class="mut">Ocupação do piso: {f2(ocup.pct)}% ({f2(ocup.area)} de {f2(sala.w * sala.d)} m²)</p>
    </section>

    {#if item}
      <section>
        <h3>{CATALOGO[item.tipo].nome}{cols.has(item.id) ? ' · colisão' : ''}</h3>
        <div class="g3">
          <label>Larg.<input value={item.w} onchange={(e) => dimensao('w', e.currentTarget.value)} inputmode="decimal" /></label>
          <label>Prof.<input value={item.d} onchange={(e) => dimensao('d', e.currentTarget.value)} inputmode="decimal" /></label>
          <label>Altura<input value={item.h} onchange={(e) => dimensao('h', e.currentTarget.value)} inputmode="decimal" /></label>
        </div>
        <div class="g3">
          <label>Elev.<input value={item.elev ?? 0} onchange={(e) => dimensao('elev', e.currentTarget.value)} inputmode="decimal" /></label>
          <label>Cor<input type="color" value={item.cor} oninput={(e) => atualizar(item.id, { cor: e.currentTarget.value })} /></label>
          <label>Giro<input value={Math.round(item.rot)} onchange={(e) => atualizar(item.id, limitar({ ...item, rot: Number(e.currentTarget.value) || 0 }, sala))} inputmode="numeric" /></label>
        </div>
        <div class="row">
          <button class="btn sm" onclick={() => girar(-90)}>↺ 90°</button>
          <button class="btn sm" onclick={() => girar(90)}>↻ 90°</button>
          <button class="btn sm" onclick={encostar}>Encostar</button>
          <button class="btn sm" onclick={duplicar}>Duplicar</button>
          <button class="btn sm" onclick={remover}>Excluir</button>
        </div>
        <p class="mut">Arraste para mover · setas movem 5 cm · R gira · Ctrl D duplica · Delete exclui.</p>
      </section>
    {/if}

    <section>
      <h3>Móveis</h3>
      {#each GRUPOS as g}
        <div class="grp">{g}</div>
        <div class="cat">
          {#each Object.entries(CATALOGO).filter(([, c]) => c.grupo === g) as [k, c]}
            <button class="chip btn-chip" onclick={() => adicionar(k)} title="{f2(c.w)} × {f2(c.d)} × {f2(c.h)} m">{c.nome}</button>
          {/each}
        </div>
      {/each}
    </section>

    <section>
      <h3>Lista ({itens.length})</h3>
      {#each lista as l}<div class="li tn">{l.n}× {l.nome} <span class="mut">{f2(l.w)}×{f2(l.d)}×{f2(l.h)}</span></div>{/each}
      <div class="row"><button class="btn sm" onclick={copiarLista}>Copiar lista</button></div>
    </section>
  </aside>

  <div class="stage card" bind:this={wrap}>
    <canvas bind:this={canvas}></canvas>
    <div class="tb">
      <span class="seg">
        <button onclick={() => cena?.vista('3d')}>3D</button>
        <button onclick={() => cena?.vista('planta')}>Planta</button>
        <button onclick={() => cena?.vista('frente')}>Frente</button>
        <button onclick={() => cena?.vista('lado')}>Lado</button>
      </span>
      <label class="sel">Paredes
        <select bind:value={paredes}><option value="auto">Automático</option><option value="todas">Todas</option><option value="nenhuma">Nenhuma</option></select>
      </label>
      <label class="sel">Grade
        <select bind:value={gradeM}><option value={0}>Livre</option><option value={0.01}>1 cm</option><option value={0.05}>5 cm</option><option value={0.1}>10 cm</option><option value={0.25}>25 cm</option></select>
      </label>
      <button class="btn sm" class:act={ortho} onclick={() => (ortho = !ortho)}>Ortogonal</button>
      <button class="btn sm" onclick={exportarPng}>PNG</button>
      <button class="btn sm" onclick={exportarJson}>Salvar</button>
      <button class="btn sm" onclick={() => fileEl.click()}>Abrir</button>
    </div>
    {#if erro}<p class="err floating">{erro}</p>{/if}
    {#if msg}<p class="floating">{msg}</p>{/if}
  </div>
</div>

<input bind:this={fileEl} type="file" accept=".json" hidden onchange={importarJson} />

<style>
  .v3d {
    height: 100%;
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 12px;
    min-height: 0;
  }
  .side {
    overflow: auto;
    padding: 14px;
    display: grid;
    gap: 14px;
    align-content: start;
  }
  h3 {
    margin: 0 0 8px;
    font: 500 12px / 1 var(--sans);
    color: var(--fg-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .g3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 8px;
    align-items: end;
  }
  label {
    display: grid;
    gap: 4px;
    font-size: 11px;
    color: var(--fg-4);
    min-width: 0;
  }
  input:not([type='color']):not([type='checkbox']),
  select {
    width: 100%;
    min-width: 0;
    height: 30px;
    border: 1px solid var(--line-2);
    border-radius: 8px;
    background: #15141299;
    padding: 0 8px;
    outline: 0;
  }
  select option {
    background: var(--panel-2);
  }
  input[type='color'] {
    width: 100%;
    height: 30px;
    padding: 2px;
    border: 1px solid var(--line-2);
    border-radius: 8px;
    background: none;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
  .grp {
    margin: 8px 0 4px;
    font-size: 11px;
    color: var(--fg-4);
  }
  .cat {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .btn-chip {
    height: 26px;
    border: 1px solid var(--line-2);
    cursor: pointer;
  }
  .btn-chip:hover {
    background: var(--panel-3);
  }
  .mut {
    color: var(--fg-4);
    font-size: 11px;
    margin: 6px 0 0;
  }
  .li {
    font-size: 12px;
    padding: 2px 0;
  }
  .stage {
    position: relative;
    overflow: hidden;
    min-height: 0;
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
  .tb {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    pointer-events: none;
  }
  .tb > * {
    pointer-events: auto;
  }
  .seg {
    background: var(--glass);
  }
  .sel {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--glass);
    padding: 2px 8px;
    border-radius: 100px;
    border: 1px solid var(--line);
  }
  .sel select {
    height: 24px;
    width: auto;
  }
  .floating {
    position: absolute;
    left: 12px;
    bottom: 10px;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--glass);
    font-size: 12px;
  }
  .err {
    color: #f0a39a;
  }
  @media (max-width: 800px) {
    .v3d {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(260px, 50%) minmax(0, 1fr);
    }
    .stage {
      order: -1;
    }
  }
</style>
