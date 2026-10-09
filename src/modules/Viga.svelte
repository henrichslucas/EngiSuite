<script>
  import { calcularViga } from './viga.js'
  import { fmtNum } from '../lib/util.js'

  let f = $state({ bw: '20', h: '50', dl: '4', fck: '25', fyk: '500', msk: '100' })

  const num = (t) => Number(String(t).trim().replace(',', '.'))
  const r = $derived(
    calcularViga({ bw: num(f.bw), h: num(f.h), dl: num(f.dl), fck: num(f.fck), fyk: num(f.fyk), msk: num(f.msk) })
  )
  const n2 = (v) => fmtNum(Math.round(v * 100) / 100)

  const campos = [
    ['bw', 'Largura bw', 'cm'],
    ['h', 'Altura h', 'cm'],
    ['dl', "Cobrimento d'", 'cm'],
    ['fck', 'fck', 'MPa'],
    ['fyk', 'fyk', 'MPa'],
    ['msk', 'Momento Msk', 'kN·m']
  ]
</script>

<div class="mod">
  <section class="card pad">
    <h2>Viga retangular à flexão</h2>
    <p class="sub">Dimensionamento no estado limite último, NBR 6118:2014. Seção retangular, flexão simples, γf 1,4, γc 1,4 e γs 1,15.</p>

    <div class="fields">
      {#each campos as [k, label, unit]}
        <label class="field">
          <span>{label}</span>
          <span class="in">
            <input inputmode="decimal" bind:value={f[k]} autocomplete="off" />
            <em>{unit}</em>
          </span>
        </label>
      {/each}
    </div>
    <p class="note">d' é a distância da face à armadura (cobrimento + estribo + metade da barra). Msk é o momento característico.</p>
  </section>

  <section class="card pad" aria-live="polite">
    {#if !r.ok}
      <h2>Resultado</h2>
      <p class="err">{r.erro}</p>
    {:else}
      <h2>Resultado</h2>
      <dl class="res">
        <div><dt>Momento de cálculo Md</dt><dd class="tn">{n2(r.md)} kN·m</dd></div>
        <div><dt>Altura útil d</dt><dd class="tn">{n2(r.d)} cm</dd></div>
        <div><dt>Linha neutra x/d</dt><dd class="tn">{n2(r.xi)}</dd></div>
        <div><dt>Armadura</dt><dd>{r.dupla ? 'Dupla' : 'Simples'}</dd></div>
        <div class="big"><dt>As (tração)</dt><dd class="tn">{n2(r.as)} cm²</dd></div>
        {#if r.dupla}
          <div class="big"><dt>A's (compressão)</dt><dd class="tn">{n2(r.asl)} cm²</dd></div>
        {/if}
        <div><dt>As,mín</dt><dd class="tn">{n2(r.asMin)} cm²</dd></div>
      </dl>

      {#each r.avisos as a}
        <p class="warn">{a}</p>
      {/each}

      <h3>Opções de bitola, tração</h3>
      <div class="opts">
        {#each r.tracao as o}
          <span class="chip tn" title="{n2(o.area)} cm²">{o.n} Ø {fmtNum(o.phi)}</span>
        {/each}
      </div>
      {#if r.dupla}
        <h3>Opções de bitola, compressão</h3>
        <div class="opts">
          {#each r.compressao as o}
            <span class="chip tn" title="{n2(o.area)} cm²">{o.n} Ø {fmtNum(o.phi)}</span>
          {/each}
        </div>
      {/if}
      <p class="note">Mínimo de 2 barras por opção. Verifique espaçamento, ancoragem, cisalhamento e estados limites de serviço separadamente.</p>
    {/if}
  </section>
</div>
