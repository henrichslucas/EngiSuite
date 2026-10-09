export const RH = 26
export const HH = 28
export const GW = 52
export const DEF_W = 96
export const MAXR = 100000
export const MAXC = 702

export function colName(i) {
  let s = ''
  let n = i + 1
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export const addr = (r, c) => colName(c) + (r + 1)

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 10 })

export const fmtNum = (n) => nf.format(n)

export function show(v) {
  if (v == null) return ''
  if (typeof v === 'number') return nf.format(v)
  if (typeof v === 'boolean') return v ? 'VERDADEIRO' : 'FALSO'
  if (typeof v === 'object') return v.value ?? '#ERRO'
  return String(v)
}

export function plain(v) {
  if (typeof v === 'number') return String(v).replace('.', ',')
  return show(v)
}

export function parseInput(t) {
  if (typeof t !== 'string') return t
  if (t === '') return null
  if (t[0] === '=') return t
  const s = t.trim()
  if (/^-?\d+,\d+$/.test(s)) return s.replace(',', '.')
  return t
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
