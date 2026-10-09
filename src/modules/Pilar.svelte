<script>
  import { calcularPilar } from './pilar.js'
  import Campos from './Campos.svelte'
  import Resultados from './Resultados.svelte'
  import { num, n2 } from './fmt.js'

  let f = $state({ b: '30', h: '30', le: '300', fck: '30', fyk: '500', as: '12,56', nk: '1000', e1h: '0,5', ma: '1', mb: '1' })
  const campos = [
    ['b', 'Largura b', 'cm'],
    ['h', 'Altura h', 'cm'],
    ['le', 'Comprimento de flambagem le', 'cm'],
    ['fck', 'fck', 'MPa'],
    ['fyk', 'fyk', 'MPa'],
    ['as', 'As total', 'cm²'],
    ['nk', 'Normal Nk', 'kN'],
    ['e1h', 'e1/h', ''],
    ['ma', 'Momento base MA', 'kN·m'],
    ['mb', 'Momento topo MB', 'kN·m']
  ]
  const r = $derived(calcularPilar({ b: num(f.b), h: num(f.h), le: num(f.le), fck: num(f.fck), fyk: num(f.fyk), as: num(f.as), nk: num(f.nk), e1h: num(f.e1h), ma: num(f.ma), mb: num(f.mb) }))
  const itens = $derived(
    r.ok
      ? [
          { k: 'Esbeltez λ (menor dimensão)', v: n2(r.lam) },
          { k: 'Limite λ1', v: n2(r.lam1) },
          { k: 'Classificação', v: r.classe },
          { k: 'Normal de cálculo Nd', v: `${n2(r.nd)} kN` },
          { k: 'Capacidade centrada NRd', v: `${n2(r.nrd)} kN`, big: true, tom: r.atende ? 'good' : 'bad' },
          { k: 'NRd / Nd', v: n2(r.folga) },
          { k: 'As,mín', v: `${n2(r.asMin)} cm²` },
          { k: 'As,máx (8%)', v: `${n2(r.asMax)} cm²` }
        ]
      : []
  )
</script>

<div class="mod">
  <section class="card pad">
    <h2>Pilar retangular</h2>
    <p class="sub">Esbeltez (NBR 6118, 15.8) e capacidade à compressão centrada. Verificação preliminar: não substitui a flexo-compressão com 2ª ordem.</p>
    <Campos {campos} bind:f />
    <p class="note">αb = 0,6 + 0,4·MB/MA (mín. 0,4); λ1 = (25 + 12,5·e1/h)/αb, entre 35 e 90. NRd usa 0,85·fcd·Ac + As·σs, com εc = 2‰.</p>
  </section>
  <section class="card pad" aria-live="polite">
    <Resultados nome="Pilar retangular" erro={r.ok ? '' : r.erro} {itens} avisos={r.avisos ?? []} />
  </section>
</div>
