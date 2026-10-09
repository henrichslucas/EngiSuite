<script>
  import { calcularFlecha, ESQUEMAS } from './flecha.js'
  import Campos from './Campos.svelte'
  import Resultados from './Resultados.svelte'
  import { num, n2 } from './fmt.js'
  import { fmtNum } from '../lib/util.js'

  let f = $state({ esquema: 'biapoiada_q', L: '5', carga: '15', bw: '20', h: '50', dl: '4', as: '8', asl: '0', fck: '25', t: '70', t0: '1', limite: '250' })
  const campos = $derived([
    ['esquema', 'Esquema estático', '', Object.entries(ESQUEMAS).map(([k, v]) => [k, v.nome])],
    ['L', 'Vão L', 'm'],
    ['carga', ESQUEMAS[f.esquema].pontual ? 'Carga P (quase-permanente)' : 'Carga q (quase-permanente)', ESQUEMAS[f.esquema].pontual ? 'kN' : 'kN/m'],
    ['limite', 'Limite L/', ''],
    ['bw', 'Largura bw', 'cm'],
    ['h', 'Altura h', 'cm'],
    ['dl', "Cobrimento d'", 'cm'],
    ['fck', 'fck', 'MPa'],
    ['as', 'As (tração)', 'cm²'],
    ['asl', "A's (compressão)", 'cm²'],
    ['t0', 'Idade da carga t0', 'meses'],
    ['t', 'Idade final t', 'meses']
  ])
  const r = $derived(calcularFlecha({ esquema: f.esquema, L: num(f.L), carga: num(f.carga), bw: num(f.bw), h: num(f.h), dl: num(f.dl), as: num(f.as), asl: num(f.asl), fck: num(f.fck), t: num(f.t), t0: num(f.t0), limite: num(f.limite) }))
  const itens = $derived(
    r.ok
      ? [
          { k: 'Ecs', v: `${fmtNum(Math.round(r.Ecs))} MPa` },
          { k: 'Momento de fissuração Mr', v: `${n2(r.Mr)} kN·m` },
          { k: 'Momento Ma', v: `${n2(r.Ma)} kN·m`, tom: r.fissurada ? 'bad' : 'good' },
          { k: 'Linha neutra no estádio II', v: `${n2(r.x2)} cm` },
          { k: 'Ic (bruta)', v: `${fmtNum(Math.round(r.Ic))} cm⁴` },
          { k: 'III (fissurada)', v: `${fmtNum(Math.round(r.III))} cm⁴` },
          { k: 'Ieq (Branson)', v: `${fmtNum(Math.round(r.Ieq))} cm⁴` },
          { k: 'Flecha imediata', v: `${n2(r.di)} mm`, big: true },
          { k: 'Fator αf (diferida)', v: n2(r.af) },
          { k: 'Flecha total', v: `${n2(r.dt)} mm`, big: true, tom: r.atende ? 'good' : 'bad' },
          { k: `Limite L/${num(f.limite)}`, v: `${n2(r.lim)} mm` }
        ]
      : []
  )
</script>

<div class="mod">
  <section class="card pad">
    <h2>Flecha em concreto armado</h2>
    <p class="sub">Flecha imediata com rigidez equivalente de Branson (17.3.2.1.1) e flecha diferida pelo fator αf (17.3.2.1.2). Seção retangular.</p>
    <Campos {campos} bind:f />
    <p class="note">Use a combinação quase-permanente de ações. t &gt; 70 meses equivale a ξ = 2. Para balanço, o limite se aplica ao dobro do comprimento do balanço, conforme a Tabela 13.3.</p>
  </section>
  <section class="card pad" aria-live="polite">
    <Resultados nome="Flecha em concreto armado" erro={r.ok ? '' : r.erro} {itens} avisos={r.avisos ?? []} />
  </section>
</div>
