<script>
  import { wb } from './workbook.svelte.js'
  import { CATALOGO, CATEGORIAS } from './catalogo.js'

  let busca = $state('')
  let cat = $state('Todas')
  let inp
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const itens = $derived.by(() => {
    const q = norm(busca.trim())
    return CATALOGO.filter((f) => (cat === 'Todas' || f.cat === cat) && (!q || norm(f.nome).includes(q) || norm(f.desc).includes(q) || norm(f.k).includes(q))).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  })

  function inserir(f) {
    const atual = wb.edit ? wb.edit.text : wb.raw(wb.sel.ar, wb.sel.ac)
    const base = atual.startsWith('=') ? atual : '='
    const texto = `${base}${f.nome}(`
    if (wb.edit) wb.edit.text = texto
    else wb.startEdit('bar', texto)
    wb.biblioteca = false
    queueMicrotask(() => {
      const e = document.querySelector('.fbar .inp')
      e?.focus()
      e?.setSelectionRange(texto.length, texto.length)
    })
  }

  const fechar = () => (wb.biblioteca = false)
  $effect(() => {
    if (wb.biblioteca) inp?.focus()
  })
</script>

<svelte:window onkeydown={(e) => wb.biblioteca && e.key === 'Escape' && fechar()} />

{#if wb.biblioteca}
  <div class="ov" role="presentation" onpointerdown={fechar}></div>
  <div class="dlg card" role="dialog" aria-label="Biblioteca de funções" aria-modal="true">
    <header>
      <h2>Funções</h2>
      <button class="btn ghost icon" onclick={fechar} aria-label="Fechar">✕</button>
    </header>
    <input bind:this={inp} class="q" placeholder="Buscar função ou descrição (ex.: média, procurar, juros)" bind:value={busca} autocomplete="off" />
    <div class="cats">
      {#each ['Todas', ...CATEGORIAS] as c}
        <button class="chip" class:on={cat === c} onclick={() => (cat = c)}>{c}</button>
      {/each}
    </div>
    <div class="lista">
      {#each itens as f (f.k)}
        <button class="it" onclick={() => inserir(f)}>
          <span class="s tn">{f.sintaxe}</span>
          <span class="d">{f.desc}</span>
        </button>
      {:else}
        <p class="vz">Nenhuma função encontrada.</p>
      {/each}
    </div>
    <p class="rod">Nomes em português (Excel); os nomes em inglês também são aceitos. Argumentos separados por “;”, decimal com vírgula.</p>
  </div>
{/if}

<style>
  .ov {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: #0008;
  }
  .dlg {
    position: fixed;
    z-index: 61;
    top: 8vh;
    left: 50%;
    transform: translateX(-50%);
    width: min(680px, calc(100vw - 24px));
    max-height: 80vh;
    display: grid;
    grid-template-rows: auto auto auto minmax(0, 1fr) auto;
    gap: 10px;
    padding: 16px;
    background: var(--panel-2);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2 {
    margin: 0;
    font: 500 22px / 1.2 var(--serif);
  }
  .q {
    height: 36px;
    border: 1px solid var(--line-2);
    border-radius: 10px;
    background: #15141299;
    padding: 0 12px;
    outline: 0;
  }
  .cats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .cats .chip {
    border: 1px solid var(--line);
    cursor: pointer;
    height: 26px;
  }
  .cats .chip.on {
    background: #fafaf924;
    border-color: var(--line-3);
  }
  .lista {
    overflow: auto;
    display: grid;
    align-content: start;
    gap: 2px;
  }
  .it {
    display: grid;
    gap: 2px;
    text-align: left;
    border: 0;
    background: none;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
  }
  .it:hover {
    background: #fafaf91c;
  }
  .s {
    font-weight: 600;
    font-size: 13px;
  }
  .d {
    color: var(--fg-4);
    font-size: 12px;
  }
  .vz,
  .rod {
    color: var(--fg-4);
    font-size: 12px;
    margin: 0;
  }
</style>
