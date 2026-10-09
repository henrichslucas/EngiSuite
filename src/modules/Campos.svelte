<script>
  // campos: [chave, rótulo, unidade] ou [chave, rótulo, unidade, [[valor, texto], ...]] para listas
  let { campos, f = $bindable() } = $props()
</script>

<div class="fields">
  {#each campos as [k, label, unit, opcoes]}
    <label class="field">
      <span>{label}</span>
      <span class="in">
        {#if opcoes}
          <select bind:value={f[k]}>
            {#each opcoes as [v, t]}<option value={v}>{t}</option>{/each}
          </select>
        {:else}
          <input inputmode="decimal" bind:value={f[k]} autocomplete="off" />
          {#if unit}<em>{unit}</em>{/if}
        {/if}
      </span>
    </label>
  {/each}
</div>
