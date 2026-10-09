<script>
  import { onMount } from 'svelte'
  import { wb } from './lib/workbook.svelte.js'
  import { importFile, exportXlsx, exportCsv } from './lib/io.js'
  import { fmtNum } from './lib/util.js'
  import Grid from './lib/Grid.svelte'
  import FormulaBar from './lib/FormulaBar.svelte'
  import Icon from './lib/Icon.svelte'
  import FormulaHelper from './lib/FormulaHelper.svelte'
  import Biblioteca from './lib/Biblioteca.svelte'
  import { MODULOS } from './modules/index.js'

  let mod = $state('planilhas')

  let fileInput
  let menuOpen = $state(false)
  let notice = $state('')
  let noticeTimer = 0
  let dropping = $state(false)
  let dragDepth = 0
  let renaming = $state(null)
  let renameText = $state('')

  const stats = $derived(wb.stats())
  const statusText = $derived({ salvo: 'Salvo', salvando: 'Salvando', erro: 'Falha ao salvar' }[wb.status])

  function say(text) {
    notice = text
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => (notice = ''), 5000)
  }

  async function handleFiles(files) {
    for (const file of files) {
      try {
        await importFile(wb, file)
        say(`${file.name} importado`)
      } catch {
        say(`Não foi possível importar ${file.name}. Use .xlsx, .xls, .ods ou .csv.`)
      }
    }
  }

  function onPick(e) {
    const files = [...e.currentTarget.files]
    e.currentTarget.value = ''
    handleFiles(files)
  }

  async function doExport(kind) {
    menuOpen = false
    try {
      if (kind === 'xlsx') await exportXlsx(wb)
      else exportCsv(wb)
    } catch {
      say('Não foi possível exportar a planilha.')
    }
  }

  function startRename(s) {
    renaming = s.id
    renameText = s.name
  }

  function finishRename(save) {
    if (renaming == null) return
    const id = renaming
    renaming = null
    if (save && !wb.renameSheet(id, renameText)) {
      if (renameText.trim() && renameText.trim() !== wb.sheets.find((s) => s.id === id)?.name) {
        say('Já existe uma planilha com esse nome.')
      }
    }
  }

  function removeActive() {
    const s = wb.sheets.find((x) => x.id === wb.active)
    if (s && confirm(`Excluir a planilha "${s.name}"?`)) wb.removeSheet(s.id)
  }

  function focusInit(node) {
    node.focus()
    node.select()
  }

  function onDragEnter(e) {
    if (!e.dataTransfer?.types?.includes('Files')) return
    dragDepth++
    dropping = true
  }

  function onDragLeave() {
    dragDepth = Math.max(0, dragDepth - 1)
    if (!dragDepth) dropping = false
  }

  function onDrop(e) {
    e.preventDefault()
    dragDepth = 0
    dropping = false
    if (e.dataTransfer?.files?.length) handleFiles([...e.dataTransfer.files])
  }

  onMount(() => {
    wb.init()
    const close = () => (menuOpen = false)
    const esc = (e) => e.key === 'Escape' && close()
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', esc)
    const warn = (e) => {
      if (wb.status === 'salvando') {
        wb.persist()
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', esc)
      window.removeEventListener('beforeunload', warn)
    }
  })
</script>

<svelte:window ondragenter={onDragEnter} ondragleave={onDragLeave} ondragover={(e) => e.preventDefault()} ondrop={onDrop} />

<div class="app">
  <header class="top enter">
    <div class="top-in">
      <span class="brand">EngiSuite</span>

      <nav class="seg mods" aria-label="Módulos">
        <button class:on={mod === 'planilhas'} aria-current={mod === 'planilhas' ? 'page' : undefined} onclick={() => (mod = 'planilhas')}>Planilhas</button>
        {#each MODULOS as m (m.id)}
          <button class:on={mod === m.id} aria-current={mod === m.id ? 'page' : undefined} onclick={() => (mod = m.id)}>{m.nome}</button>
        {/each}
      </nav>

      <select class="modsel" bind:value={mod} aria-label="Módulo">
        <option value="planilhas">Planilhas</option>
        {#each MODULOS as m (m.id)}<option value={m.id}>{m.nome}</option>{/each}
      </select>

      <div class="right">
        {#if mod === 'planilhas'}
        <span class="status" role="status">
          <span class="dot" class:busy={wb.status === 'salvando'} class:err={wb.status === 'erro'}></span>
          <span class="status-txt">{notice || statusText}</span>
        </span>

        <button class="btn ghost icon" onclick={() => wb.undo()} disabled={!wb.canUndo} aria-label="Desfazer" title="Desfazer (Ctrl Z)">
          <Icon name="undo" />
        </button>
        <button class="btn ghost icon" onclick={() => wb.redo()} disabled={!wb.canRedo} aria-label="Refazer" title="Refazer (Ctrl Y)">
          <Icon name="redo" />
        </button>

        <button class="btn act" onclick={() => fileInput.click()} aria-label="Importar arquivo">
          <Icon name="upload" /><span class="lbl">Importar</span>
        </button>

        <div class="menu-wrap" onpointerdown={(e) => e.stopPropagation()} role="presentation">
          <button class="btn act" onclick={() => (menuOpen = !menuOpen)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Exportar">
            <Icon name="download" /><span class="lbl">Exportar</span>
          </button>
          {#if menuOpen}
            <div class="menu card" role="menu">
              <button role="menuitem" onclick={() => doExport('xlsx')}>Excel (.xlsx), todas as planilhas</button>
              <button role="menuitem" onclick={() => doExport('csv')}>CSV, planilha atual</button>
            </div>
          {/if}
        </div>
        {/if}
      </div>
    </div>
  </header>

  {#if mod !== 'planilhas'}
    <div class="modview">
      {#key mod}
        {@const Comp = MODULOS.find((m) => m.id === mod).componente}
        <Comp />
      {/key}
    </div>
  {:else}

  <div class="enter" style="animation-delay: 70ms">
    <FormulaBar {wb} />
  </div>

  {#if wb.ready}
    <Grid {wb} />
  {:else}
    <div class="card"></div>
  {/if}

  <footer class="dock card enter" style="animation-delay: 210ms">
    <div class="tabs" role="tablist" aria-label="Planilhas">
      {#each wb.sheets as s (s.id)}
        {#if renaming === s.id}
          <input
            class="tab-input"
            bind:value={renameText}
            use:focusInit
            onblur={() => finishRename(true)}
            onkeydown={(e) => {
              if (e.key === 'Enter') finishRename(true)
              if (e.key === 'Escape') finishRename(false)
            }}
            aria-label="Nome da planilha"
          />
        {:else}
          <button
            class="tab"
            class:on={s.id === wb.active}
            role="tab"
            aria-selected={s.id === wb.active}
            onclick={() => wb.setActive(s.id)}
            ondblclick={() => startRename(s)}
            title="Clique duplo para renomear"
          >
            {s.name}
          </button>
        {/if}
      {/each}
    </div>
    <button class="btn ghost icon sm" onclick={() => wb.addSheet()} aria-label="Nova planilha" title="Nova planilha">
      <Icon name="plus" />
    </button>
    {#if wb.sheets.length > 1}
      <button class="btn ghost icon sm" onclick={removeActive} aria-label="Excluir planilha atual" title="Excluir planilha atual">
        <Icon name="x" />
      </button>
    {/if}

    {#if wb.multi && stats.count > 0}
      <div class="stats">
        <span class="stat"><span class="k">Soma</span><span class="tn">{fmtNum(stats.sum)}</span></span>
        <span class="stat"><span class="k">Média</span><span class="tn">{fmtNum(stats.avg)}</span></span>
        <span class="stat"><span class="k">Contagem</span><span class="tn">{stats.count}</span></span>
      </div>
    {/if}
  </footer>
  {/if}
</div>

<FormulaHelper />
<Biblioteca />

<input bind:this={fileInput} type="file" accept=".xlsx,.xls,.ods,.csv,.tsv" multiple hidden onchange={onPick} />

{#if dropping}
  <div class="drop" aria-hidden="true">
    <div>
      <h2>Solte o arquivo para importar</h2>
      <p>Excel (.xlsx, .xls), ODS ou CSV</p>
    </div>
  </div>
{/if}

<style>
  .app {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-rows: 44px 36px minmax(0, 1fr) 40px;
    gap: 12px;
    padding: max(14px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
    background: radial-gradient(110% 90% at 55% 50%, #141310, #0f0e0d 58%, #0b0a09);
  }

  .modsel {
    display: none;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--line-2);
    border-radius: 100px;
    background: #15141299;
    font: 500 13px / 1 var(--sans);
  }

  .modsel option {
    background: var(--panel-2);
  }

  @media print {
    .app {
      position: static;
      display: block;
      padding: 0;
      background: none;
    }

    .top {
      display: none;
    }

    .modview {
      grid-row: auto;
    }
  }

  .modview {
    grid-row: 2 / 5;
    min-height: 0;
  }

  .top {
    container-type: inline-size;
    container-name: top;
    min-width: 0;
  }

  .top-in {
    display: flex;
    align-items: center;
    gap: 20px;
    height: 44px;
  }

  .brand {
    font: 400 22px / 1 var(--serif);
    letter-spacing: -0.01em;
  }

  .mods {
    margin-inline: auto;
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .mods + .right {
    margin-left: 0;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-right: 8px;
    font: 500 12px / 1.3 var(--sans);
    color: var(--fg-3);
    max-width: 280px;
  }

  .status-txt {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-wrap {
    position: relative;
  }

  .menu {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 10;
    display: flex;
    flex-direction: column;
    min-width: 260px;
    padding: 6px;
    border-radius: 16px;
  }

  .menu button {
    height: 34px;
    padding: 0 12px;
    border: 0;
    border-radius: 10px;
    background: none;
    text-align: left;
    font: 500 13px / 1 var(--sans);
    cursor: pointer;
  }

  .menu button:hover {
    background: #fafaf914;
  }

  .dock {
    justify-self: center;
    display: flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    height: 40px;
    padding: 4px 6px;
    border-radius: 100px;
  }

  .tabs {
    display: flex;
    gap: 2px;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tabs::-webkit-scrollbar {
    display: none;
  }

  .tab-input {
    height: 28px;
    width: 140px;
    padding: 0 12px;
    border: 1px solid var(--line-3);
    border-radius: 100px;
    outline: 0;
    background: var(--panel-3);
    font: 500 13px / 1 var(--sans);
  }

  .sm {
    height: 30px;
    width: 30px;
    flex: none;
  }

  .stats {
    display: flex;
    gap: 16px;
    margin-left: 8px;
    padding: 0 14px 0 16px;
    border-left: 1px solid var(--line);
    font: 500 12px / 1 var(--sans);
    white-space: nowrap;
  }

  .stat {
    display: inline-flex;
    gap: 6px;
  }

  .k {
    color: var(--fg-4);
  }

  .drop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    text-align: center;
    background: rgba(15, 14, 13, 0.72);
    backdrop-filter: blur(10px);
    pointer-events: none;
  }

  .drop h2 {
    margin: 0 0 6px;
    font: 400 var(--t-manchete) / 1.1 var(--serif);
    text-wrap: balance;
  }

  .drop p {
    margin: 0;
    color: var(--fg-3);
  }

  @container top (max-width: 900px) {
    .lbl,
    .status-txt {
      display: none;
    }

    .act {
      width: 36px;
      padding: 0;
      justify-content: center;
    }
  }

  @container top (max-width: 640px) {
    .mods {
      display: none;
    }

    .modsel {
      display: block;
    }

    .right {
      margin-left: auto;
    }
  }

  @media (max-width: 740px) {
    .stats {
      display: none;
    }

    .app {
      padding-left: 12px;
      padding-right: 12px;
    }
  }
</style>
