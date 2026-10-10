<script>
  import Icon from './Icon.svelte'
  import { AREAS, CALC_GRUPOS, areaDe, nomeDe } from '../modules/index.js'

  // variante: 'top' (cabeçalho, telas largas) ou 'bottom' (barra inferior, celular)
  let { mod = $bindable(), variante = 'top' } = $props()
  let aberto = $state(false)
  const area = $derived(areaDe(mod))

  function escolher(id) {
    aberto = false
    if (id === 'calculos') {
      if (area !== 'calculos') mod = 'viga'
      else aberto = true
    } else mod = id
  }

  function menuClick(id) {
    mod = id
    aberto = false
  }
</script>

<svelte:window onpointerdown={(e) => aberto && !e.target.closest?.('.nav-' + variante) && (aberto = false)} onkeydown={(e) => e.key === 'Escape' && (aberto = false)} />

<nav class="nav-{variante}" class:bottom={variante === 'bottom'} aria-label="Áreas do aplicativo">
  <div class={variante === 'top' ? 'seg' : 'tabs-b'}>
    {#each AREAS as a (a.id)}
      <button class:on={area === a.id} aria-current={area === a.id ? 'page' : undefined} onclick={() => escolher(a.id)} aria-haspopup={a.id === 'calculos' ? 'menu' : undefined} aria-expanded={a.id === 'calculos' ? aberto : undefined}>
        {#if variante === 'bottom'}<Icon name={a.icone} size={20} />{/if}
        <span>{a.id === 'calculos' && area === 'calculos' ? nomeDe(mod) : a.nome}</span>
        {#if a.id === 'calculos' && variante === 'top'}<Icon name="chevron" size={12} />{/if}
      </button>
    {/each}
  </div>

  {#if aberto}
    <div class="pop card" class:up={variante === 'bottom'} role="menu">
      {#each CALC_GRUPOS as g}
        <div class="gh">{g.nome}</div>
        {#each g.ids as id}
          <button role="menuitem" class:on={mod === id} onclick={() => menuClick(id)}>{nomeDe(id)}</button>
        {/each}
      {/each}
    </div>
  {/if}
</nav>

<style>
  nav {
    position: relative;
    min-width: 0;
  }
  .seg button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .pop {
    position: absolute;
    z-index: 40;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    min-width: 230px;
    max-height: 70vh;
    overflow: auto;
    padding: 6px;
    display: grid;
    background: var(--panel-2);
    box-shadow: 0 14px 40px #000a;
  }
  .pop.up {
    top: auto;
    bottom: calc(100% + 10px);
    left: 8px;
    right: 8px;
    transform: none;
    max-height: 60vh;
  }
  .gh {
    padding: 10px 10px 4px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-5);
  }
  .pop button {
    text-align: left;
    height: 40px;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: none;
    cursor: pointer;
    color: var(--fg-2);
  }
  .pop button:hover,
  .pop button.on {
    background: #fafaf91c;
    color: var(--fg);
  }
  .tabs-b {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  .tabs-b button {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 3px;
    min-height: 54px;
    padding: 6px 2px;
    border: 0;
    background: none;
    color: var(--fg-4);
    font: 500 11px / 1.1 var(--sans);
    cursor: pointer;
  }
  .tabs-b button span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tabs-b button.on {
    color: var(--fg);
  }
  .tabs-b button.on :global(svg) {
    color: #6aa8ff;
  }
</style>
