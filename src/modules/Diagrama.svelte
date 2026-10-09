<script>
  // curva: [{ x, ... }]; chave: campo plotado; baixo: valores positivos desenhados para baixo
  let { curva, chave, L, titulo, unidade, fator = 1, baixo = false, casas = 2 } = $props()
  const W = 640
  const H = 124
  const PX = 36
  const vals = $derived(curva.map((p) => p[chave] * fator))
  const lo = $derived(Math.min(0, ...vals))
  const hi = $derived(Math.max(0, ...vals))
  const span = $derived(hi - lo || 1)
  const px = (x) => PX + (x / L) * (W - 2 * PX)
  const py = (v) => {
    const t = (v - lo) / span
    return 30 + (baixo ? t : 1 - t) * (H - 52)
  }
  const zero = $derived(py(0))
  const pts = $derived(curva.map((p) => `${px(p.x).toFixed(1)},${py(p[chave] * fator).toFixed(1)}`))
  const area = $derived(`M${px(0)},${zero} L${pts.join(' L')} L${px(L)},${zero} Z`)
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas }).format(v)
  const iMax = $derived(vals.reduce((b, v, i) => (Math.abs(v) > Math.abs(vals[b]) ? i : b), 0))
</script>

<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Diagrama de {titulo}">
  <text x={PX} y="10" font-size="11" fill="currentColor">{titulo} ({unidade})</text>
  <path d={area} fill="currentColor" opacity="0.14" />
  <polyline points={pts.join(' ')} fill="none" stroke="currentColor" stroke-width="1.6" />
  <line x1={px(0)} x2={px(L)} y1={zero} y2={zero} stroke="currentColor" opacity="0.5" />
  <text
    x={px(curva[iMax].x) + (curva[iMax].x === 0 ? 4 : curva[iMax].x === L ? -4 : 0)}
    y={py(vals[iMax]) + (vals[iMax] >= 0 !== baixo ? -5 : 13)}
    font-size="11"
    fill="currentColor"
    text-anchor={curva[iMax].x === 0 ? 'start' : curva[iMax].x === L ? 'end' : 'middle'}>{fmt(vals[iMax])}</text>
</svg>
