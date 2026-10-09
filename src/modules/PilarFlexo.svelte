<script>
  import { calcularFlexoCompressao } from './pilarFlexo.js'
  import Campos from './Campos.svelte'
  import Resultados from './Resultados.svelte'
  import { num, n2 } from './fmt.js'

  let f = $state({ b: '30', h: '50', dl: '4', as: '20', fck: '30', fyk: '500', nk: '800', mk: '60' })
  const campos = [
    ['b', 'Largura b', 'cm'],
    ['h', 'Altura h (direção do momento)', 'cm'],
    ['dl', "Cobrimento d'", 'cm'],
    ['as', 'As total (metade em cada face)', 'cm²'],
    ['fck', 'fck', 'MPa'],
    ['fyk', 'fyk', 'MPa'],
    ['nk', 'Normal Nk', 'kN'],
    ['mk', 'Momento Mk', 'kN·m']
  ]
  const r = $derived(calcularFlexoCompressao({ b: num(f.b), h: num(f.h), dl: num(f.dl), as: num(f.as), fck: num(f.fck), fyk: num(f.fyk), nk: num(f.nk), mk: num(f.mk) }))
  const itens = $derived(
    r.ok
      ? [
          { k: 'Nd', v: `${n2(r.nd)} kN` },
          { k: 'Md (com momento mínimo)', v: `${n2(r.md)} kN·m` },
          { k: 'MRd para Nd', v: `${n2(r.mrd)} kN·m`, big: true, tom: r.atende ? 'good' : 'bad' },
          { k: 'MRd / Md', v: n2(r.folga) },
          { k: 'Taxa de armadura', v: `${n2(r.rho * 100)} %` },
          { k: 'Compressão centrada máx.', v: `${n2(r.nmax)} kN` }
        ]
      : []
  )
  const W = 520
  const H = 280
  const g = $derived.by(() => {
    if (!r.ok) return null
    const c = r.curva
    const nMin = Math.min(...c.map((p) => p.N))
    const nMax = Math.max(...c.map((p) => p.N))
    const mMax = Math.max(...c.map((p) => p.M)) * 1.1 || 1
    const px = (m) => 50 + (m / mMax) * (W - 70)
    const py = (n) => 16 + (1 - (n - nMin) / (nMax - nMin)) * (H - 40)
    return { px, py, path: c.map((p) => `${px(p.M).toFixed(1)},${py(p.N).toFixed(1)}`).join(' '), mMax }
  })
</script>

<div class="mod">
  <section class="card pad">
    <h2>Pilar: flexo-compressão</h2>
    <p class="sub">Flexão composta normal, armadura simétrica, por compatibilidade de deformações (NBR 6118, 17.2). γf 1,4, γc 1,4 e γs 1,15.</p>
    <Campos {campos} bind:f />
    <p class="note">Aplica o momento mínimo de 1ª ordem, Nd·(1,5 + 0,03h). Sem 2ª ordem: confira a esbeltez no módulo Pilar.</p>
  </section>
  <section class="card pad" aria-live="polite">
    <Resultados nome="Pilar: flexo-compressão" erro={r.ok ? '' : r.erro} {itens} avisos={r.avisos ?? []} />
    {#if g}
      <svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Diagrama de interação N-M">
        <text x="50" y="10" font-size="11" fill="currentColor">Diagrama N × M (compressão para cima)</text>
        <polyline points={g.path} fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="1.6" />
        <line x1="50" x2="50" y1="16" y2={H - 24} stroke="currentColor" opacity="0.4" />
        <circle cx={g.px(r.md)} cy={g.py(r.nd)} r="4.5" fill={r.atende ? '#9fd8a8' : '#f0a39a'} />
        <text x={g.px(r.md) + 8} y={g.py(r.nd) + 4} font-size="11" fill="currentColor">Nd, Md</text>
        <text x={W - 20} y={H - 8} font-size="11" fill="currentColor" text-anchor="end">M (kN·m)</text>
      </svg>
    {/if}
  </section>
</div>
