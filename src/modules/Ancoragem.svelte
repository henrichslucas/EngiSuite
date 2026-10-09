<script>
  import { calcularAncoragem } from './ancoragem.js'
  import Campos from './Campos.svelte'
  import Resultados from './Resultados.svelte'
  import { num, n2 } from './fmt.js'

  let f = $state({ phi: '16', fck: '25', fyk: '500', aderencia: 'boa', superficie: 'nervurada', gancho: 'nao', asCalc: '8', asEf: '8,04', emendados: '50' })
  const campos = [
    ['phi', 'Bitola Ø', 'mm'],
    ['fck', 'fck', 'MPa'],
    ['fyk', 'fyk', 'MPa'],
    ['aderencia', 'Aderência', '', [['boa', 'Boa (situação de boa aderência)'], ['ma', 'Má aderência']]],
    ['superficie', 'Superfície', '', [['nervurada', 'Nervurada (CA-50/60)'], ['entalhada', 'Entalhada'], ['lisa', 'Lisa (CA-25)']]],
    ['gancho', 'Extremidade', '', [['nao', 'Barra reta'], ['sim', 'Com gancho']]],
    ['asCalc', 'As,calc', 'cm²'],
    ['asEf', 'As,ef', 'cm²'],
    ['emendados', 'Barras emendadas', '%']
  ]
  const r = $derived(calcularAncoragem({ phi: num(f.phi), fck: num(f.fck), fyk: num(f.fyk), aderencia: f.aderencia, superficie: f.superficie, gancho: f.gancho === 'sim', asCalc: num(f.asCalc), asEf: num(f.asEf), emendados: num(f.emendados) }))
  const itens = $derived(
    r.ok
      ? [
          { k: 'fbd', v: `${n2(r.fbd)} MPa` },
          { k: 'lb (básico)', v: `${n2(r.lb)} cm` },
          { k: 'lb,mín', v: `${n2(r.lbMin)} cm` },
          { k: 'lb,nec (ancoragem)', v: `${n2(r.lbNec)} cm`, big: true },
          { k: 'α0t (emenda)', v: n2(r.a0t) },
          { k: 'l0t,mín', v: `${n2(r.l0tMin)} cm` },
          { k: 'l0t (traspasse)', v: `${n2(r.l0t)} cm`, big: true }
        ]
      : []
  )
</script>

<div class="mod">
  <section class="card pad">
    <h2>Ancoragem e emenda</h2>
    <p class="sub">Comprimento de ancoragem (9.4) e emenda por traspasse (9.5) de armaduras passivas. γc 1,4 e γs 1,15.</p>
    <Campos {campos} bind:f />
    <p class="note">Com gancho, α = 0,7 (cobrimento ≥ 3Ø). Considere má aderência em peças com h &gt; 60 cm e barras na metade superior, ou inclinadas.</p>
  </section>
  <section class="card pad" aria-live="polite">
    <Resultados nome="Ancoragem e emenda" erro={r.ok ? '' : r.erro} {itens} />
  </section>
</div>
