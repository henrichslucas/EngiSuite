<script>
  import { FORMAS, propriedadesSecao } from './secao.js'
  import Campos from './Campos.svelte'
  import Resultados from './Resultados.svelte'
  import { num, n2 } from './fmt.js'
  import { fmtNum } from '../lib/util.js'

  const DEF = { retangular: { b: '20', h: '50' }, circular: { D: '30' }, tubo: { D: '30', t: '1' }, caixao: { b: '30', h: '50', t: '5' }, T: { bf: '60', hf: '10', bw: '20', h: '50' }, I: { bf: '15', tf: '1', tw: '0.8', h: '30' } }
  let forma = $state('T')
  let f = $state({ forma: 'T', ...DEF.T })
  const campos = $derived([['forma', 'Seção', '', Object.entries(FORMAS).map(([k, v]) => [k, v.nome])], ...FORMAS[f.forma].campos.map(([k, l]) => [k, l, 'cm'])])
  $effect(() => {
    if (f.forma !== forma) {
      forma = f.forma
      Object.assign(f, DEF[forma])
    }
  })
  const dims = $derived(Object.fromEntries(FORMAS[f.forma].campos.map(([k]) => [k, num(f[k])])))
  const r = $derived(propriedadesSecao(f.forma, dims))
  const itens = $derived(
    r.ok
      ? [
          { k: 'Área A', v: `${n2(r.A)} cm²`, big: true },
          { k: 'Centroide (a partir da base)', v: `${n2(r.yg)} cm` },
          { k: 'Inércia Ix', v: `${fmtNum(Math.round(r.Ix))} cm⁴`, big: true },
          { k: 'Inércia Iy', v: `${fmtNum(Math.round(r.Iy))} cm⁴` },
          { k: 'Módulo Wx (fibra inferior)', v: `${n2(r.WxInf)} cm³` },
          { k: 'Módulo Wx (fibra superior)', v: `${n2(r.WxSup)} cm³` },
          { k: 'Raio de giração rx', v: `${n2(r.rx)} cm` },
          { k: 'Raio de giração ry', v: `${n2(r.ry)} cm` }
        ]
      : []
  )
</script>

<div class="mod">
  <section class="card pad">
    <h2>Propriedades de seção</h2>
    <p class="sub">Área, centroide, momentos de inércia e módulos resistentes de seções planas homogêneas. Eixo x horizontal pelo centroide.</p>
    <Campos {campos} bind:f />
  </section>
  <section class="card pad" aria-live="polite">
    <Resultados nome="Propriedades de seção ({FORMAS[f.forma].nome})" erro={r.ok ? '' : r.erro} {itens} />
    <p class="note">Use Ix aqui com o módulo de elasticidade no módulo de Esforços e flecha para estimar deslocamentos.</p>
  </section>
</div>
