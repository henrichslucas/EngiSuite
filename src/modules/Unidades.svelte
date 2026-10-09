<script>
  import { GRANDEZAS, converter } from './unidades.js'
  import { num } from './fmt.js'
  import { fmtNum } from '../lib/util.js'

  let g = $state('Força')
  let valor = $state('1')
  let de = $state('tf')
  const nomes = $derived(Object.keys(GRANDEZAS[g].un))
  $effect(() => {
    if (!nomes.includes(de)) de = nomes[0]
  })
  const fmt = (n) => new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 7 }).format(n)
  const linhas = $derived(nomes.filter((u) => u !== de).map((u) => [u, converter(g, num(valor), de, u)]))
</script>

<div class="mod">
  <section class="card pad">
    <h2>Conversor de unidades</h2>
    <p class="sub">Força, pressão, comprimento, momento, área e cargas lineares ou de volume. Usa g = 9,80665 m/s².</p>
    <div class="fields">
      <label class="field"><span>Grandeza</span><span class="in"><select bind:value={g}>{#each Object.keys(GRANDEZAS) as k}<option>{k}</option>{/each}</select></span></label>
      <label class="field"><span>Unidade de origem</span><span class="in"><select bind:value={de}>{#each nomes as u}<option>{u}</option>{/each}</select></span></label>
      <label class="field"><span>Valor</span><span class="in"><input inputmode="decimal" bind:value={valor} autocomplete="off" /></span></label>
    </div>
  </section>
  <section class="card pad" aria-live="polite">
    <h2>Equivalências</h2>
    <dl class="res">
      {#each linhas as [u, v]}
        <div><dt>{u}</dt><dd class="tn">{Number.isNaN(v) ? '—' : fmt(v)}</dd></div>
      {/each}
    </dl>
  </section>
</div>
