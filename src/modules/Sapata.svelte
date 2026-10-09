<script>
  import { calcularSapata } from './sapata.js'
  import Campos from './Campos.svelte'
  import Resultados from './Resultados.svelte'
  import { num, n2 } from './fmt.js'

  let f = $state({ N: '1000', M: '100', L: '2,5', B: '2', sigAdm: '250', pp: '10', lp: '0,4' })
  const campos = [
    ['N', 'Normal N (serviço)', 'kN'],
    ['M', 'Momento M', 'kN·m'],
    ['L', 'Lado L (direção de M)', 'm'],
    ['B', 'Lado B', 'm'],
    ['sigAdm', 'Tensão admissível', 'kPa'],
    ['pp', 'Peso próprio + solo', '% de N'],
    ['lp', 'Lado do pilar (L)', 'm']
  ]
  const r = $derived(calcularSapata({ N: num(f.N), M: num(f.M), L: num(f.L), B: num(f.B), sigAdm: num(f.sigAdm), pp: num(f.pp), lp: num(f.lp) }))
  const itens = $derived(
    r.ok
      ? [
          { k: 'Normal total', v: `${n2(r.Nt)} kN` },
          { k: 'Excentricidade e', v: `${n2(r.e)} m` },
          { k: 'Tensão média', v: `${n2(r.med)} kPa` },
          { k: 'Tensão máxima', v: `${n2(r.sMax)} kPa`, big: true, tom: r.sMax <= 1.3 * num(f.sigAdm) ? 'good' : 'bad' },
          { k: 'Tensão mínima', v: `${n2(r.sMin)} kPa` },
          { k: 'Base comprimida', v: `${n2(r.comprimida)} m` },
          { k: 'FS ao tombamento', v: Number.isFinite(r.fsTomb) ? n2(r.fsTomb) : 'sem momento' },
          { k: 'Área mínima (centrada)', v: `${n2(r.areaMin)} m²` },
          { k: 'Sapata quadrada sugerida', v: `${n2(r.ladoQuadrado)} m` },
          { k: 'Altura mín. (sapata rígida)', v: `${n2(r.hMin)} m` }
        ]
      : []
  )
</script>

<div class="mod">
  <section class="card pad">
    <h2>Sapata isolada</h2>
    <p class="sub">Tensões no solo com momento em uma direção, tombamento e altura mínima para sapata rígida (NBR 6118, 22.6.1). Cargas de serviço.</p>
    <Campos {campos} bind:f />
    <p class="note">Critérios: σmédia ≤ σadm, σmáx ≤ 1,3·σadm. Não considera recalques, punção nem armadura do tirante.</p>
  </section>
  <section class="card pad" aria-live="polite">
    <Resultados nome="Sapata isolada" erro={r.ok ? '' : r.erro} {itens} avisos={r.avisos ?? []} />
  </section>
</div>
