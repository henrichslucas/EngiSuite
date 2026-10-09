<script>
  import { calcularPerfilI } from './aco.js'
  import Campos from './Campos.svelte'
  import Resultados from './Resultados.svelte'
  import { num, n2 } from './fmt.js'
  import { fmtNum } from '../lib/util.js'

  let f = $state({ bf: '15', tf: '1,2', tw: '0,8', h: '30', fy: '345', msk: '80', vsk: '60', lb: '150' })
  const campos = [
    ['bf', 'Largura da mesa bf', 'cm'],
    ['tf', 'Espessura da mesa tf', 'cm'],
    ['tw', 'Espessura da alma tw', 'cm'],
    ['h', 'Altura total h', 'cm'],
    ['fy', 'fy', 'MPa'],
    ['lb', 'Comprimento destravado Lb', 'cm'],
    ['msk', 'Momento Mk', 'kN·m'],
    ['vsk', 'Cortante Vk', 'kN']
  ]
  const r = $derived(calcularPerfilI({ bf: num(f.bf), tf: num(f.tf), tw: num(f.tw), h: num(f.h), fy: num(f.fy), msk: num(f.msk), vsk: num(f.vsk), lb: num(f.lb) }))
  const itens = $derived(
    r.ok
      ? [
          { k: 'Área', v: `${n2(r.A)} cm²` },
          { k: 'Ix', v: `${fmtNum(Math.round(r.Ix))} cm⁴` },
          { k: 'Wx / Zx', v: `${n2(r.Wx)} / ${n2(r.Zx)} cm³` },
          { k: 'λ mesa / λ alma', v: `${n2(r.lamF)} / ${n2(r.lamW)}` },
          { k: 'Classe', v: r.compacta ? 'Compacta' : 'Não compacta' },
          { k: 'Msd / MRd', v: `${n2(r.Msd)} / ${n2(r.Mrd)} kN·m`, big: true, tom: r.utilM <= 1 ? 'good' : 'bad' },
          { k: 'Aproveitamento à flexão', v: `${n2(r.utilM * 100)} %` },
          { k: 'Vsd / VRd', v: `${n2(r.Vsd)} / ${n2(r.Vrd)} kN`, big: true, tom: r.utilV <= 1 ? 'good' : 'bad' },
          { k: 'Aproveitamento ao cortante', v: `${n2(r.utilV * 100)} %` },
          { k: 'Lp (FLT)', v: `${n2(r.Lp)} cm` }
        ]
      : []
  )
</script>

<div class="mod">
  <section class="card pad">
    <h2>Perfil I de aço</h2>
    <p class="sub">Flexão e cortante de perfil I duplamente simétrico, NBR 8800:2008. γa1 = 1,1; γf = 1,4 aplicado aos esforços informados.</p>
    <Campos {campos} bind:f />
    <p class="note">Inclui classificação (Anexo G), Mrd limitado a 1,5·Wx·fy e conferência de Lb ≤ Lp. Fora de Lp, calcule a FLT (G.2.1). Não cobre compressão axial nem flambagem local de seções esbeltas.</p>
  </section>
  <section class="card pad" aria-live="polite">
    <Resultados nome="Perfil I de aço" erro={r.ok ? '' : r.erro} {itens} avisos={r.avisos ?? []} />
  </section>
</div>
