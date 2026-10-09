<script>
  // itens: [{ k, v, big?, tom?: 'good' | 'bad' }]
  let { titulo = 'Resultado', itens = [], avisos = [], erro = '', nome = '' } = $props()
  let copiado = $state(false)

  async function copiar() {
    const txt = [nome && `${nome}`, ...itens.map((i) => `${i.k}: ${i.v}`), ...avisos.map((a) => `Aviso: ${a}`)].filter(Boolean).join('\n')
    try {
      await navigator.clipboard.writeText(txt)
      copiado = true
      setTimeout(() => (copiado = false), 1800)
    } catch {}
  }
</script>

<p class="print-only">EngiSuite · Memória de cálculo · {nome} · {new Date().toLocaleDateString('pt-BR')}</p>
<div class="head">
  <h2>{titulo}</h2>
  {#if !erro && itens.length}
    <span class="acts">
      <button class="btn" onclick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>
      <button class="btn" onclick={() => window.print()}>Imprimir / PDF</button>
    </span>
  {/if}
</div>

{#if erro}
  <p class="err">{erro}</p>
{:else}
  <dl class="res">
    {#each itens as i}
      <div class:big={i.big} class:good={i.tom === 'good'} class:bad={i.tom === 'bad'}><dt>{i.k}</dt><dd class="tn">{i.v}</dd></div>
    {/each}
  </dl>
  {#each avisos as a}<p class="warn">{a}</p>{/each}
{/if}
