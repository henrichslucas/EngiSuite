<script>
  import { tick } from 'svelte'
  import { wb } from './workbook.svelte.js'
  import { contexto, dica, sugestoes } from './ajuda.js'

  let el = null
  let lista = $state([])
  let ativo = $state(0)
  let token = $state(null)
  let hint = $state(null)
  let pos = $state({ x: 0, y: 0, w: 0 })
  let fechado = false

  const editavel = (e) => e instanceof HTMLInputElement && (e.classList.contains('cell-input') || e.classList.contains('inp'))

  function atualizar() {
    const e = document.activeElement
    if (!editavel(e) || !wb.edit) {
      limpar()
      return
    }
    el = e
    const caret = e.selectionStart ?? e.value.length
    const ctx = contexto(e.value, caret)
    const r = e.getBoundingClientRect()
    pos = { x: r.left, y: r.bottom + 6, w: r.width }
    token = ctx.token
    lista = !fechado && ctx.token ? sugestoes(ctx.token.texto) : []
    if (ativo >= lista.length) ativo = 0
    hint = dica(ctx.funcao)
  }

  function limpar() {
    lista = []
    hint = null
    token = null
    fechado = false
  }

  async function aceitar(i = ativo) {
    const s = lista[i]
    if (!s || !el || !token) return
    const t = el.value
    const novo = t.slice(0, token.inicio) + s.nome + '(' + t.slice(token.fim).replace(/^\(/, '')
    const caret = token.inicio + s.nome.length + 1
    if (wb.edit) wb.edit.text = novo
    el.value = novo
    await tick()
    el.setSelectionRange(caret, caret)
    el.focus()
    fechado = false
    atualizar()
  }

  function teclas(e) {
    if (!lista.length || !editavel(document.activeElement)) return
    if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      aceitar()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      ativo = (ativo + (e.key === 'ArrowDown' ? 1 : -1) + lista.length) % lista.length
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      e.preventDefault()
      fechado = true
      lista = []
    }
  }

  function aoDigitar() {
    fechado = false
    queueMicrotask(atualizar)
  }
</script>

<svelte:window onkeydowncapture={teclas} oninput={aoDigitar} onkeyup={atualizar} onclick={atualizar} onfocusin={() => queueMicrotask(atualizar)} onfocusout={() => setTimeout(atualizar, 0)} />

{#if lista.length || hint}
  <div class="fh card" style="left:{pos.x}px; top:{pos.y}px; min-width:{Math.max(pos.w, 260)}px" role="listbox" aria-label="Sugestões de funções">
    {#if hint}
      <div class="dica">
        <span class="sin tn">{hint.nome}(<!-- -->{#each hint.args as a, i}{#if i}; {/if}<span class:cur={i === hint.atual}>{a}</span>{/each})</span>
        <span class="desc">{hint.desc}</span>
      </div>
    {/if}
    {#each lista as s, i (s.nome)}
      <button class="op" class:on={i === ativo} role="option" aria-selected={i === ativo} onmousedown={(e) => (e.preventDefault(), aceitar(i))}>
        <span class="nm tn">{s.nome}</span>
        <span class="ds">{s.info?.desc ?? 'Função do motor de cálculo.'}</span>
      </button>
    {/each}
    {#if lista.length}<div class="foot">Tab insere · ↑ ↓ navegam · Esc fecha</div>{/if}
  </div>
{/if}

<style>
  .fh {
    position: fixed;
    z-index: 50;
    max-width: min(520px, calc(100vw - 24px));
    padding: 6px;
    background: var(--panel-2);
    border-radius: 12px;
    box-shadow: 0 12px 40px #0009;
  }
  .dica {
    padding: 6px 8px 8px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 4px;
  }
  .sin {
    display: block;
    font: 500 13px / 1.4 var(--sans);
  }
  .sin .cur {
    color: #6aa8ff;
    font-weight: 700;
  }
  .desc {
    color: var(--fg-4);
    font-size: 12px;
  }
  .op {
    display: grid;
    grid-template-columns: minmax(110px, auto) 1fr;
    gap: 12px;
    width: 100%;
    text-align: left;
    padding: 5px 8px;
    border: 0;
    border-radius: 8px;
    background: none;
    cursor: pointer;
    align-items: baseline;
  }
  .op.on,
  .op:hover {
    background: #fafaf91c;
  }
  .nm {
    font-weight: 600;
    font-size: 13px;
  }
  .ds {
    color: var(--fg-4);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .foot {
    padding: 6px 8px 2px;
    color: var(--fg-5);
    font-size: 11px;
  }
</style>
