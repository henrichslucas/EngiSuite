<script>
  import { calcularEsforcos, eiKnm2 } from './esforcos.js'
  import Campos from './Campos.svelte'
  import Resultados from './Resultados.svelte'
  import Diagrama from './Diagrama.svelte'
  import { num, n2, n3 } from './fmt.js'

  let f = $state({ tipo: 'biapoiada', L: '6', q: '10', P1: '0', a1: '3', P2: '0', a2: '1,5', P3: '0', a3: '4,5', E: '25', I: '260000', limite: '250' })
  const campos = [
    ['tipo', 'Vinculação', '', [['biapoiada', 'Biapoiada'], ['balanco', 'Em balanço']]],
    ['L', 'Vão L', 'm'],
    ['q', 'Carga distribuída q', 'kN/m'],
    ['limite', 'Limite da flecha L/', ''],
    ['P1', 'Carga P1', 'kN'],
    ['a1', 'Posição a1', 'm'],
    ['P2', 'Carga P2', 'kN'],
    ['a2', 'Posição a2', 'm'],
    ['P3', 'Carga P3', 'kN'],
    ['a3', 'Posição a3', 'm'],
    ['E', 'Módulo E', 'GPa'],
    ['I', 'Inércia I', 'cm⁴']
  ]
  const preset = (e) => (f.E = e)
  const r = $derived.by(() => {
    const cargas = [1, 2, 3].map((i) => ({ P: num(f['P' + i]), a: num(f['a' + i]) })).filter((c) => c.P !== 0)
    return calcularEsforcos({ tipo: f.tipo, L: num(f.L), q: num(f.q), cargas, EI: eiKnm2(num(f.E), num(f.I)) || 0, limite: num(f.limite) || 250 })
  })
  const itens = $derived(
    r.ok
      ? [
          { k: f.tipo === 'biapoiada' ? 'Reação em A (x = 0)' : 'Reação vertical no engaste', v: `${n2(r.RA)} kN` },
          f.tipo === 'biapoiada' ? { k: 'Reação em B (x = L)', v: `${n2(r.RB)} kN` } : { k: 'Momento no engaste', v: `${n2(r.MA)} kN·m` },
          { k: 'Cortante máximo', v: `${n2(r.vmax)} kN (x = ${n2(r.xv)} m)` },
          { k: 'Momento máximo', v: `${n2(r.mmax)} kN·m (x = ${n2(r.xm)} m)`, big: true },
          ...(r.flecha != null
            ? [
                { k: 'Flecha elástica máxima', v: `${n2(r.flecha * 1000)} mm (x = ${n2(r.xf)} m)`, big: true },
                { k: `Limite L/${num(f.limite) || 250}`, v: `${n2(r.flechaLim * 1000)} mm`, tom: r.flechaOk ? 'good' : 'bad' }
              ]
            : [])
        ]
      : []
  )
</script>

<div class="mod">
  <section class="card pad">
    <h2>Esforços e flecha</h2>
    <p class="sub">Viga isostática com carga distribuída e até três cargas pontuais. Diagramas de cortante, momento e deslocamento.</p>
    <Campos {campos} bind:f />
    <div class="opts" style="margin-top: 12px">
      <button class="btn" onclick={() => preset('210')}>Aço 210 GPa</button>
      <button class="btn" onclick={() => preset('24')}>Concreto C25 (Ecs ≈ 24)</button>
    </div>
    <p class="note">Cargas positivas para baixo. Em concreto armado, use I efetiva (fissurada) ou um fator de redução sobre Ig e some a flecha diferida. A flecha aqui é elástica linear.</p>
  </section>
  <section class="card pad" aria-live="polite">
    <Resultados nome="Esforços e flecha" erro={r.ok ? '' : r.erro} {itens} />
    {#if r.ok}
      <Diagrama curva={r.curva} chave="v" L={num(f.L)} titulo="Cortante V" unidade="kN" />
      <Diagrama curva={r.curva} chave="m" L={num(f.L)} titulo="Momento M (tração embaixo para valores positivos)" unidade="kN·m" baixo={f.tipo === 'biapoiada'} />
      {#if r.flecha != null}
        <Diagrama curva={r.curva} chave="y" L={num(f.L)} titulo="Deslocamento vertical" unidade="mm" fator={1000} baixo casas={3} />
      {/if}
    {/if}
  </section>
</div>
