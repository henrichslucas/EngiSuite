<script>
  import { calcularCisalhamento } from './cisalhamento.js'
  import Campos from './Campos.svelte'
  import Resultados from './Resultados.svelte'
  import { num, n2 } from './fmt.js'
  import { fmtNum } from '../lib/util.js'

  let f = $state({ bw: '20', h: '50', dl: '4', fck: '25', fywk: '500', vsk: '100', pernas: '2' })
  const campos = [
    ['bw', 'Largura bw', 'cm'],
    ['h', 'Altura h', 'cm'],
    ['dl', "Cobrimento d'", 'cm'],
    ['fck', 'fck', 'MPa'],
    ['fywk', 'fywk (estribo)', 'MPa'],
    ['vsk', 'Cortante Vsk', 'kN'],
    ['pernas', 'Pernas do estribo', '', [['2', '2 pernas'], ['3', '3 pernas'], ['4', '4 pernas']]]
  ]
  const r = $derived(calcularCisalhamento({ bw: num(f.bw), h: num(f.h), dl: num(f.dl), fck: num(f.fck), fywk: num(f.fywk), vsk: num(f.vsk), pernas: Number(f.pernas) }))
  const itens = $derived(
    r.vsd == null
      ? []
      : [
          { k: 'Cortante de cálculo Vsd', v: `${n2(r.vsd)} kN` },
          { k: 'Biela VRd2', v: `${n2(r.vrd2)} kN`, tom: r.ok ? 'good' : 'bad' },
          { k: 'Parcela do concreto Vc', v: `${n2(r.vc)} kN` },
          { k: 'Parcela do aço Vsw', v: `${n2(r.vsw)} kN` },
          { k: 'Asw/s calculada', v: `${n2(r.aswCalc)} cm²/m` },
          { k: 'Asw/s mínima', v: `${n2(r.aswMin)} cm²/m` },
          { k: 'Asw/s adotada', v: `${n2(r.asw)} cm²/m`, big: true },
          { k: 'Espaçamento máximo', v: `${n2(r.smax)} cm` }
        ]
  )
</script>

<div class="mod">
  <section class="card pad">
    <h2>Cisalhamento em viga</h2>
    <p class="sub">NBR 6118:2014, 17.4.2.2, Modelo I (θ = 45°, estribos verticais, flexão simples). γf 1,4, γc 1,4 e γs 1,15.</p>
    <Campos {campos} bind:f />
    <p class="note">fywd é limitado a 435 MPa. Use o d' da armadura longitudinal tracionada.</p>
  </section>
  <section class="card pad" aria-live="polite">
    <Resultados nome="Cisalhamento em viga" erro={r.erro} {itens} avisos={r.avisos ?? []} />
    {#if r.opcoes}
      <h3>Estribos sugeridos</h3>
      <div class="opts">
        {#each r.opcoes as o}<span class="chip tn">Ø {fmtNum(o.phi)} c/ {fmtNum(o.s)} cm ({o.pernas} pernas)</span>{/each}
      </div>
    {/if}
  </section>
</div>
