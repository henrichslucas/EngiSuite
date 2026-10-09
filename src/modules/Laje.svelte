<script>
  import { calcularLaje } from './laje.js'
  import Campos from './Campos.svelte'
  import Resultados from './Resultados.svelte'
  import { num, n2 } from './fmt.js'
  import { fmtNum } from '../lib/util.js'

  let f = $state({ h: '12', dl: '2,5', fck: '25', fyk: '500', mk: '8' })
  const campos = [
    ['h', 'Espessura h', 'cm'],
    ['dl', "Cobrimento d'", 'cm'],
    ['fck', 'fck', 'MPa'],
    ['fyk', 'fyk', 'MPa'],
    ['mk', 'Momento mk (por metro)', 'kN·m/m']
  ]
  const r = $derived(calcularLaje({ h: num(f.h), dl: num(f.dl), fck: num(f.fck), fyk: num(f.fyk), mk: num(f.mk) }))
  const itens = $derived(
    r.ok
      ? [
          { k: 'Md por metro', v: `${n2(r.md)} kN·m/m` },
          { k: 'x/d', v: n2(r.xi) },
          { k: 'As calculada', v: `${n2(r.asCalc)} cm²/m` },
          { k: 'As mínima', v: `${n2(r.asMin)} cm²/m` },
          { k: 'As adotada', v: `${n2(r.as)} cm²/m`, big: true },
          { k: 'Espaçamento máximo', v: `${n2(r.smax)} cm` }
        ]
      : []
  )
</script>

<div class="mod">
  <section class="card pad">
    <h2>Laje maciça, faixa de 1 m</h2>
    <p class="sub">Armadura de flexão por metro a partir do momento fletor característico por metro (vindo de tabelas, grelha ou elementos finitos).</p>
    <Campos {campos} bind:f />
    <p class="note">Espaçamento máximo: menor entre 2h e 20 cm (20.1). A mínima usa o critério de Md,mín da seção de 1 m, sem redução para armaduras bidirecionais.</p>
  </section>
  <section class="card pad" aria-live="polite">
    <Resultados nome="Laje maciça" erro={r.ok ? '' : r.erro} {itens} avisos={r.avisos ?? []} />
    {#if r.opcoes}
      <h3>Bitola e espaçamento</h3>
      <div class="opts">
        {#each r.opcoes as o}<span class="chip tn" title="{n2(o.area)} cm²/m">Ø {fmtNum(o.phi)} c/ {fmtNum(o.s)}</span>{/each}
      </div>
    {/if}
  </section>
</div>
