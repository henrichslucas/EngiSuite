<script>
  import { onMount, tick } from 'svelte'
  import { CATALOGO, SOLOS, gruposDe, itensDe, opcoesPadrao } from './catalog.js'
  import { caixa, colisoes, limitar, novoItem, ocupacao } from './layout.js'
  import { exemploExterno, exemploInterno, salaPadrao } from './exemplos.js'
  import { load, save } from '../lib/store.js'
  import { drawing } from '../cad/doc.svelte.js'
  import { bbox } from '../cad/geom.js'

  const KEY = 'room3d-v2'
  let canvas
  let wrap
  let fileEl
  let cena = $state.raw(null)
  let erro = $state('')
  let msg = $state('')
  let msgTimer = 0

  let modo = $state('interno')
  let sala = $state(salaPadrao('interno'))
  let itens = $state(exemploInterno(salaPadrao('interno')))
  let guardado = $state({ interno: null, externo: null }) // estado do modo que não está ativo
  let hora = $state(14)
  let sel = $state(null)
  let gradeM = $state(0.05)
  let paredes = $state('auto')
  let ortho = $state(false)
  let aba = $state('ambiente')
  let painelAberto = $state(true)
  let resetAberto = $state(false)
  let passado = $state([])
  let futuro = $state([])
  let pronto = false
  let timer = 0

  const item = $derived(itens.find((i) => i.id === sel) ?? null)
  const def = $derived(item ? CATALOGO[item.tipo] : null)
  const cols = $derived(colisoes(itens))
  const ocup = $derived(ocupacao(itens, sala))
  const externo = $derived(modo === 'externo')
  const lista = $derived.by(() => {
    const m = new Map()
    for (const i of itens) {
      const k = `${i.tipo}|${i.w}|${i.d}|${i.h}`
      const o = m.get(k) ?? { nome: CATALOGO[i.tipo].nome, w: i.w, d: i.d, h: i.h, n: 0, zona: !!CATALOGO[i.tipo].zona }
      o.n++
      m.set(k, o)
    }
    return [...m.values()]
  })

  const f2 = (n) => (Math.round(n * 100) / 100).toLocaleString('pt-BR')
  const avisar = (t) => {
    msg = t
    clearTimeout(msgTimer)
    msgTimer = setTimeout(() => (msg = ''), 5000)
  }

  // ---------- persistência e histórico ----------
  function salvar() {
    clearTimeout(timer)
    timer = setTimeout(() => save(KEY, { modo, sala: $state.snapshot(sala), itens: $state.snapshot(itens), guardado: $state.snapshot(guardado), hora }).catch(() => {}), 500)
  }

  const instantaneo = () => JSON.stringify({ modo, sala, itens, guardado })

  function registrar() {
    passado.push(instantaneo())
    if (passado.length > 100) passado.shift()
    futuro = []
  }

  function restaurar(json) {
    const s = JSON.parse(json)
    const mudou = modo !== s.modo
    modo = s.modo
    sala = s.sala
    itens = s.itens
    guardado = s.guardado
    sel = null
    salvar()
    if (mudou) enquadrar()
  }

  function desfazer() {
    const s = passado.pop()
    if (!s) return
    futuro.push(instantaneo())
    restaurar(s)
  }

  function refazer() {
    const s = futuro.pop()
    if (!s) return
    passado.push(instantaneo())
    restaurar(s)
  }

  function atualizar(id, patch, historico = true) {
    if (historico) registrar()
    itens = itens.map((i) => (i.id === id ? { ...i, ...patch } : i))
    salvar()
  }

  // ---------- edição ----------
  function adicionar(tipo) {
    registrar()
    let it = novoItem(tipo, sala)
    const n = itens.length
    it = limitar({ ...it, x: it.x + ((n % 5) - 2) * 0.15, z: it.z + ((n % 3) - 1) * 0.15 }, sala)
    itens = [...itens, it]
    sel = it.id
    salvar()
  }

  function remover() {
    if (!item) return
    registrar()
    itens = itens.filter((i) => i.id !== sel)
    sel = null
    salvar()
  }

  function duplicar() {
    if (!item) return
    registrar()
    const c = limitar({ ...item, id: novoItem(item.tipo, sala).id, x: item.x + 0.3, z: item.z + 0.3 }, sala)
    itens = [...itens, c]
    sel = c.id
    salvar()
  }

  function girar(g) {
    if (!item) return
    atualizar(item.id, limitar({ ...item, rot: (((item.rot + g) % 360) + 360) % 360 }, sala))
  }

  // encosta o fundo do móvel (ou a parede da casa) na divisa/parede mais próxima
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

  function opcao(k, v) {
    if (!item) return
    const patch = { op: { ...item.op, [k]: v } }
    if (item.tipo === 'casa' && k === 'andares') patch.h = v === '2' ? 7.5 : 5
    atualizar(item.id, limitar({ ...item, ...patch }, sala))
  }

  function mudarSala(campo, v) {
    const n = Number(String(v).replace(',', '.'))
    const [min, max] = externo ? [5, 100] : [1, 30]
    if (!Number.isFinite(n) || n < min || n > max) {
      avisar(`Use um valor entre ${min} e ${max} m.`)
      return
    }
    registrar()
    sala = { ...sala, [campo]: n }
    itens = itens.map((i) => limitar(i, sala))
    salvar()
  }

  function mudarSolo(v) {
    registrar()
    sala = { ...sala, solo: v }
    salvar()
  }

  // ---------- modo interno / externo ----------
  function trocarModo(novo) {
    if (novo === modo) return
    registrar()
    guardado = { ...guardado, [modo]: { sala: $state.snapshot(sala), itens: $state.snapshot(itens) } }
    const g = guardado[novo]
    modo = novo
    sala = g?.sala ?? salaPadrao(novo)
    itens = g?.itens ?? (novo === 'externo' ? exemploExterno(sala) : exemploInterno(sala))
    sel = null
    aba = 'moveis'
    salvar()
    enquadrar()
  }

  // reposiciona a câmera depois que a cena aplicou as novas dimensões
  async function enquadrar() {
    await tick()
    cena?.vista('3d')
  }

  // ---------- reset ----------
  function resetar(tipo) {
    resetAberto = false
    if (tipo === 'camera') {
      cena?.vista('3d')
      avisar('Câmera restaurada.')
      return
    }
    registrar()
    const base = salaPadrao(modo)
    sala = { ...base }
    itens = tipo === 'exemplo' ? (externo ? exemploExterno(base) : exemploInterno(base)) : []
    hora = 14
    sel = null
    gradeM = 0.05
    paredes = 'auto'
    ortho = false
    aba = 'moveis'
    enquadrar()
    avisar(tipo === 'exemplo' ? 'Cena restaurada ao exemplo. Desfazer volta o que havia antes.' : 'Cena limpa. Desfazer volta o que havia antes.')
    salvar()
  }

  function doDesenho() {
    const e = drawing.ents.find((x) => drawing.sel.includes(x.id)) ?? null
    const b = e ? bbox(e) : null
    if (!b) {
      avisar('No módulo de desenho 2D, selecione uma polilinha fechada (o contorno do cômodo ou do terreno).')
      return
    }
    const fator = drawing.unidade === 'cm' ? 0.01 : drawing.unidade === 'mm' ? 0.001 : 1
    const w = (b.x2 - b.x1) * fator
    const d = (b.y2 - b.y1) * fator
    const [min, max] = externo ? [5, 100] : [1, 30]
    if (w < min || d < min || w > max || d > max) {
      avisar(`Dimensões fora do intervalo (${f2(w)} × ${f2(d)} m). Ajuste a unidade do desenho.`)
      return
    }
    registrar()
    sala = { ...sala, w: Math.round(w * 100) / 100, d: Math.round(d * 100) / 100 }
    itens = itens.map((i) => limitar(i, sala))
    avisar(`${externo ? 'Terreno' : 'Cômodo'} ajustado para ${f2(sala.w)} × ${f2(sala.d)} m.`)
    salvar()
  }

  function onKey(ev) {
    const campo = ev.target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(ev.target.tagName)
    if (campo) return
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') return ev.preventDefault(), ev.shiftKey ? refazer() : desfazer()
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'y') return ev.preventDefault(), refazer()
    if (!item) return
    const passo = ev.shiftKey ? 0.01 : 0.05
    if (ev.key === 'Delete' || ev.key === 'Backspace') (ev.preventDefault(), remover())
    else if (ev.key.toLowerCase() === 'r') girar(ev.shiftKey ? -90 : 90)
    else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'd') (ev.preventDefault(), duplicar())
    else if (ev.key.startsWith('Arrow')) {
      ev.preventDefault()
      const d = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[ev.key]
      atualizar(item.id, limitar({ ...item, x: item.x + d[0], z: item.z + d[1] }, sala), false)
    } else if (ev.key === 'Escape') sel = null
  }

  // ---------- arquivos ----------
  function baixar(nome, url) {
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    a.click()
  }
  const exportarPng = () => cena && baixar(externo ? 'ambiente-externo.png' : 'comodo.png', cena.captura())
  const exportarJson = () => {
    const dados = { v: 2, modo, sala: $state.snapshot(sala), itens: $state.snapshot(itens), guardado: $state.snapshot(guardado), hora }
    const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 1)], { type: 'application/json' }))
    baixar('ambiente3d.json', url)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function importarJson(ev) {
    const file = ev.currentTarget.files[0]
    ev.currentTarget.value = ''
    if (!file) return
    try {
      const j = JSON.parse(await file.text())
      if (!j.sala || !Array.isArray(j.itens)) throw new Error()
      registrar()
      const m = j.modo === 'externo' ? 'externo' : 'interno'
      modo = m
      sala = { ...salaPadrao(m), ...j.sala }
      itens = j.itens.filter((i) => CATALOGO[i.tipo]).map((i) => ({ op: opcoesPadrao(i.tipo), ...i }))
      guardado = j.guardado ?? { interno: null, externo: null }
      hora = j.hora ?? 14
      sel = null
      salvar()
      enquadrar()
    } catch {
      avisar('Arquivo inválido.')
    }
  }
  async function copiarLista() {
    const t = lista.map((l) => `${l.n}x ${l.nome} ${f2(l.w)} × ${f2(l.d)}${l.zona ? ` (${f2(l.n * l.w * l.d)} m²)` : ` × ${f2(l.h)}`} m`).join('\n')
    try {
      await navigator.clipboard.writeText(`${externo ? 'Terreno' : 'Cômodo'} ${f2(sala.w)} × ${f2(sala.d)} m\n${t}`)
      avisar('Lista copiada.')
    } catch {}
  }

  // ---------- ligação com a cena 3D ----------
  $effect(() => {
    if (!cena) return
    cena.setSala($state.snapshot(sala))
    cena.setHora(hora)
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
  $effect(() => {
    cena?.setHora(hora)
  })
  $effect(() => {
    if (sel) aba = 'item'
    else if (aba === 'item') aba = 'moveis'
  })

  onMount(() => {
    let ro
    let vivo = true
    ;(async () => {
      try {
        let s = await load(KEY).catch(() => null)
        if (!s) {
          const v1 = await load('room3d-v1').catch(() => null)
          if (v1?.sala) s = { modo: 'interno', sala: { ...salaPadrao('interno'), ...v1.sala }, itens: v1.itens ?? [], guardado: { interno: null, externo: null } }
        }
        if (s?.sala) {
          modo = s.modo === 'externo' ? 'externo' : 'interno'
          sala = { ...salaPadrao(modo), ...s.sala }
          itens = (s.itens ?? []).filter((i) => CATALOGO[i.tipo]).map((i) => ({ op: opcoesPadrao(i.tipo), ...i }))
          guardado = s.guardado ?? { interno: null, externo: null }
          hora = s.hora ?? 14
        }
        const { Cena } = await import('./scene3d.js')
        if (!vivo) return
        cena = new Cena(canvas, {
          onSelect: (id) => (sel = id),
          onDragStart: () => registrar(),
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

  const ABAS = [
    ['ambiente', 'Ambiente'],
    ['moveis', 'Adicionar'],
    ['item', 'Item'],
    ['lista', 'Lista']
  ]
</script>

<svelte:window onkeydown={onKey} />

<div class="v3d" class:fechado={!painelAberto}>
  <aside class="side card" aria-label="Painel do ambiente">
    <div class="abas" role="tablist">
      {#each ABAS as [id, nome]}
        <button role="tab" class:on={aba === id} aria-selected={aba === id} disabled={id === 'item' && !item} onclick={() => ((aba = id), (painelAberto = true))}>{nome}</button>
      {/each}
      <button class="fold" onclick={() => (painelAberto = !painelAberto)} aria-label={painelAberto ? 'Recolher painel' : 'Abrir painel'}>{painelAberto ? '▾' : '▴'}</button>
    </div>

    <div class="corpo">
      <section class:on={aba === 'ambiente'}>
        <h3>Ambiente</h3>
        <div class="seg modo" role="group" aria-label="Tipo de ambiente">
          <button class:on={!externo} onclick={() => trocarModo('interno')}>Interno</button>
          <button class:on={externo} onclick={() => trocarModo('externo')}>Externo</button>
        </div>
        <h3>{externo ? 'Terreno (m)' : 'Cômodo (m)'}</h3>
        <div class="g3">
          <label>Larg.<input value={sala.w} onchange={(e) => mudarSala('w', e.currentTarget.value)} inputmode="decimal" /></label>
          <label>Prof.<input value={sala.d} onchange={(e) => mudarSala('d', e.currentTarget.value)} inputmode="decimal" /></label>
          {#if !externo}<label>Altura<input value={sala.h} onchange={(e) => mudarSala('h', e.currentTarget.value)} inputmode="decimal" /></label>{/if}
        </div>
        {#if externo}
          <label class="full">Solo do terreno
            <select value={sala.solo} onchange={(e) => mudarSolo(e.currentTarget.value)}>
              {#each Object.entries(SOLOS) as [k, s]}<option value={k}>{s.nome}</option>{/each}
            </select>
          </label>
        {:else}
          <div class="g3">
            <label>Parede<input type="color" bind:value={sala.cParede} onfocus={registrar} onchange={salvar} /></label>
            <label>Piso<input type="color" bind:value={sala.cPiso} onfocus={registrar} onchange={salvar} /></label>
          </div>
        {/if}
        <label class="full">Hora do dia: {String(Math.floor(hora)).padStart(2, '0')}:{String(Math.round((hora % 1) * 60)).padStart(2, '0')}
          <input type="range" min="6" max="19" step="0.25" bind:value={hora} onchange={salvar} aria-label="Hora do dia" />
        </label>
        <div class="row"><button class="btn sm" onclick={doDesenho} title="Usa a caixa envolvente do objeto selecionado no desenho 2D">Medidas do desenho 2D</button></div>
        <p class="mut">Ocupação: {f2(ocup.pct)}% ({f2(ocup.area)} de {f2(sala.w * sala.d)} m²)</p>
      </section>

      <section class:on={aba === 'item'} class:vazio={!item}>
        {#if item}
          <h3>{def.nome}{cols.has(item.id) ? ' · colisão' : ''}</h3>
          <div class="g3">
            <label>Larg.<input value={item.w} onchange={(e) => dimensao('w', e.currentTarget.value)} inputmode="decimal" /></label>
            <label>Prof.<input value={item.d} onchange={(e) => dimensao('d', e.currentTarget.value)} inputmode="decimal" /></label>
            <label>Altura<input value={item.h} onchange={(e) => dimensao('h', e.currentTarget.value)} inputmode="decimal" /></label>
          </div>
          <div class="g3">
            <label>Elev.<input value={item.elev ?? 0} onchange={(e) => dimensao('elev', e.currentTarget.value)} inputmode="decimal" /></label>
            <label>Cor<input type="color" value={item.cor} onfocus={registrar} oninput={(e) => atualizar(item.id, { cor: e.currentTarget.value }, false)} /></label>
            <label>Giro °<input value={Math.round(item.rot)} onchange={(e) => atualizar(item.id, limitar({ ...item, rot: Number(e.currentTarget.value) || 0 }, sala))} inputmode="numeric" /></label>
          </div>
          {#each def.opcoes ?? [] as o}
            <label class="full">{o.nome}
              <select value={item.op?.[o.k] ?? o.padrao} onchange={(e) => opcao(o.k, e.currentTarget.value)}>
                {#each o.valores as [v, t]}<option value={v}>{t}</option>{/each}
              </select>
            </label>
          {/each}
          <div class="row">
            <button class="btn sm" onclick={() => girar(-90)}>↺ 90°</button>
            <button class="btn sm" onclick={() => girar(90)}>↻ 90°</button>
            <button class="btn sm" onclick={encostar}>Encostar</button>
            <button class="btn sm" onclick={duplicar}>Duplicar</button>
            <button class="btn sm" onclick={remover}>Excluir</button>
          </div>
          <p class="mut">Arraste para mover · setas movem 5 cm · R gira · Ctrl D duplica · Delete exclui.{def.zona ? ' Pisos arrastam só depois de selecionados.' : ''}</p>
        {:else}
          <p class="mut">Toque em um objeto na cena para editar.</p>
        {/if}
      </section>

      <section class:on={aba === 'moveis'}>
        <h3>{externo ? 'Elementos' : 'Móveis'}</h3>
        {#each gruposDe(modo) as g}
          <div class="grp">{g}</div>
          <div class="cat">
            {#each itensDe(modo, g) as [k, c]}
              <button class="chip btn-chip" onclick={() => adicionar(k)} title="{f2(c.w)} × {f2(c.d)}{c.zona ? '' : ` × ${f2(c.h)}`} m">{c.nome}</button>
            {/each}
          </div>
        {/each}
      </section>

      <section class:on={aba === 'lista'}>
        <h3>Lista ({itens.length})</h3>
        {#each lista as l}<div class="li tn">{l.n}× {l.nome} <span class="mut">{f2(l.w)}×{f2(l.d)}{l.zona ? ` · ${f2(l.n * l.w * l.d)} m²` : `×${f2(l.h)}`}</span></div>{:else}<p class="mut">A cena está vazia.</p>{/each}
        <div class="row"><button class="btn sm" onclick={copiarLista}>Copiar lista</button></div>
      </section>
    </div>
  </aside>

  <div class="stage card" bind:this={wrap}>
    <canvas bind:this={canvas}></canvas>

    <div class="tb">
      <span class="seg vistas">
        <button onclick={() => cena?.vista('3d')}>3D</button>
        <button onclick={() => cena?.vista('planta')}>Planta</button>
        <button onclick={() => cena?.vista('frente')}>Frente</button>
        <button onclick={() => cena?.vista('lado')}>Lado</button>
      </span>
      {#if !externo}
        <label class="sel">Paredes
          <select bind:value={paredes}><option value="auto">Automático</option><option value="todas">Todas</option><option value="nenhuma">Nenhuma</option></select>
        </label>
      {/if}
      <label class="sel">Grade
        <select bind:value={gradeM}><option value={0}>Livre</option><option value={0.01}>1 cm</option><option value={0.05}>5 cm</option><option value={0.1}>10 cm</option><option value={0.25}>25 cm</option><option value={0.5}>50 cm</option></select>
      </label>
      <button class="btn sm" class:act={ortho} onclick={() => (ortho = !ortho)}>Ortogonal</button>
      <button class="btn sm" onclick={desfazer} disabled={!passado.length}>Desfazer</button>
      <button class="btn sm" onclick={refazer} disabled={!futuro.length}>Refazer</button>
      <span class="resetwrap">
        <button class="btn sm perigo" onclick={() => (resetAberto = !resetAberto)} aria-expanded={resetAberto} aria-haspopup="menu">Resetar</button>
        {#if resetAberto}
          <div class="menu-reset card" role="menu">
            <button role="menuitem" onclick={() => resetar('exemplo')}>Restaurar exemplo</button>
            <button role="menuitem" onclick={() => resetar('limpar')}>Limpar tudo</button>
            <button role="menuitem" onclick={() => resetar('camera')}>Só a câmera</button>
            <p class="mut">{externo ? 'Terreno' : 'Cômodo'} atual. Dá para desfazer.</p>
          </div>
        {/if}
      </span>
      <button class="btn sm" onclick={exportarPng}>PNG</button>
      <button class="btn sm" onclick={exportarJson}>Salvar</button>
      <button class="btn sm" onclick={() => fileEl.click()}>Abrir</button>
    </div>

    {#if item}
      <div class="acoes card" role="toolbar" aria-label="Ações do objeto selecionado">
        <span class="nm">{def.nome}</span>
        <button class="btn sm" onclick={() => girar(-90)} aria-label="Girar à esquerda">↺</button>
        <button class="btn sm" onclick={() => girar(90)} aria-label="Girar à direita">↻</button>
        <button class="btn sm" onclick={duplicar}>Duplicar</button>
        <button class="btn sm" onclick={remover}>Excluir</button>
      </div>
    {/if}

    {#if erro}<p class="err floating">{erro}</p>{/if}
    {#if msg}<p class="floating">{msg}</p>{/if}
  </div>
</div>

<input bind:this={fileEl} type="file" accept=".json" hidden onchange={importarJson} />

<style>
  .v3d {
    height: 100%;
    display: grid;
    grid-template-columns: 310px minmax(0, 1fr);
    gap: 12px;
    min-height: 0;
  }
  .side {
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
  }
  .abas {
    display: flex;
    gap: 2px;
    padding: 8px 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .abas button {
    flex: 1;
    height: 34px;
    border: 0;
    border-radius: 8px 8px 0 0;
    background: none;
    color: var(--fg-4);
    font: 500 12px / 1 var(--sans);
    cursor: pointer;
  }
  .abas button.on {
    color: var(--fg);
    box-shadow: inset 0 -2px 0 #6aa8ff;
  }
  .abas button[disabled] {
    color: var(--fg-5);
    cursor: default;
  }
  .fold {
    display: none;
    flex: none !important;
    width: 36px;
  }
  .corpo {
    overflow: auto;
    padding: 12px 14px 16px;
    display: grid;
    gap: 14px;
    align-content: start;
  }
  /* telas largas: todas as seções visíveis; no celular só a da aba ativa */
  section {
    display: block;
  }
  @media (min-width: 801px) {
    section.vazio,
    .abas {
      display: none;
    }
    .side {
      grid-template-rows: minmax(0, 1fr);
    }
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
  .full {
    margin-bottom: 10px;
  }
  input:not([type='color']):not([type='checkbox']):not([type='range']),
  select {
    width: 100%;
    min-width: 0;
    height: 32px;
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
    height: 32px;
    padding: 2px;
    border: 1px solid var(--line-2);
    border-radius: 8px;
    background: none;
  }
  input[type='range'] {
    width: 100%;
    accent-color: #6aa8ff;
    height: 28px;
  }
  .modo {
    display: flex;
    margin-bottom: 14px;
  }
  .modo button {
    flex: 1;
    height: 32px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .btn.sm {
    height: 30px;
    padding: 0 10px;
    font-size: 12px;
    flex: none;
  }
  .btn.act {
    background: #6aa8ff33;
    border-color: #6aa8ff88;
  }
  .btn.perigo {
    border-color: #f0a39a66;
    color: #f0b4ac;
  }
  .grp {
    margin: 10px 0 4px;
    font-size: 11px;
    color: var(--fg-4);
  }
  .cat {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .btn-chip {
    height: 28px;
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
    gap: 6px;
    align-items: center;
    pointer-events: none;
  }
  .tb > * {
    pointer-events: auto;
  }
  .seg.vistas {
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
    white-space: nowrap;
  }
  .sel select {
    height: 24px;
    width: auto;
  }
  .tb .btn {
    background: var(--glass);
    backdrop-filter: blur(10px);
  }
  .resetwrap {
    position: relative;
  }
  .menu-reset {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 20;
    min-width: 200px;
    padding: 6px;
    display: grid;
    background: var(--panel-2);
    box-shadow: 0 12px 36px #000a;
  }
  .menu-reset button {
    height: 38px;
    text-align: left;
    padding: 0 10px;
    border: 0;
    border-radius: 8px;
    background: none;
    cursor: pointer;
    color: var(--fg-2);
  }
  .menu-reset button:hover {
    background: #fafaf91c;
  }
  .acoes {
    position: absolute;
    left: 50%;
    bottom: 12px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-radius: 100px;
    max-width: calc(100% - 20px);
    background: var(--panel-2);
  }
  .acoes .nm {
    padding: 0 8px;
    font-size: 12px;
    color: var(--fg-3);
    white-space: nowrap;
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .floating {
    position: absolute;
    left: 12px;
    top: 56px;
    right: 12px;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--glass);
    font-size: 12px;
    pointer-events: none;
  }
  .err {
    color: #f0a39a;
  }

  @media (max-width: 800px) {
    .v3d {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(0, 1fr) auto;
      gap: 8px;
    }
    .stage {
      order: -1;
    }
    .side {
      max-height: 46vh;
      border-radius: 18px;
    }
    .v3d.fechado .side {
      max-height: none;
    }
    .v3d.fechado .corpo {
      display: none;
    }
    .fold {
      display: block;
    }
    .corpo section {
      display: none;
    }
    .corpo section.on {
      display: block;
    }
    .abas button {
      height: 40px;
    }
    /* barra de ferramentas rola na horizontal, em uma linha */
    .tb {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      pointer-events: auto;
      padding-bottom: 2px;
    }
    .tb > * {
      flex: none;
    }
    .menu-reset {
      position: fixed;
      left: 12px;
      right: 12px;
      top: auto;
      bottom: calc(60px + env(safe-area-inset-bottom));
    }
    .acoes {
      bottom: 8px;
    }
    .floating {
      top: 52px;
    }
  }
</style>
