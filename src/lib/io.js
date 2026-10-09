import { parseInput, plain } from './util.js'
import { formulaDoXlsx } from './formulas.js'

const download = (blob, name) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const cellRaw = (cell, normalize) => {
  if (!cell) return null
  if (cell.f) return '=' + formulaDoXlsx(cell.f)
  if (cell.t === 'e') return null
  if (cell.t === 's' && normalize) return parseInput(cell.v)
  return cell.v ?? null
}

function toMatrix(XLSX, ws, normalize) {
  if (!ws || !ws['!ref']) return [[]]
  const rg = XLSX.utils.decode_range(ws['!ref'])
  const out = []
  for (let r = 0; r <= rg.e.r; r++) {
    const row = []
    for (let c = 0; c <= rg.e.c; c++) row.push(cellRaw(ws[XLSX.utils.encode_cell({ r, c })], normalize))
    out.push(row)
  }
  return out
}

function toWidths(ws) {
  const out = {}
  ;(ws['!cols'] ?? []).forEach((col, i) => {
    const w = col?.wpx ?? (col?.wch ? col.wch * 7 + 5 : null)
    if (w) out[i] = Math.round(Math.max(40, w))
  })
  return out
}

export async function importFile(wb, file) {
  const XLSX = await import('xlsx')
  const isText = /\.(csv|tsv|txt)$/i.test(file.name)
  const book = isText
    ? XLSX.read(await file.text(), { type: 'string' })
    : XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const base = file.name.replace(/\.[^.]+$/, '')
  let first = null
  for (const name of book.SheetNames) {
    const ws = book.Sheets[name]
    const created = wb.addSheetData(isText ? base : name, toMatrix(XLSX, ws, isText), toWidths(ws))
    first ??= created
  }
  if (first) wb.setActiveByName(first)
  return book.SheetNames.length
}

export async function exportXlsx(wb) {
  const XLSX = await import('xlsx')
  const book = XLSX.utils.book_new()
  for (const s of wb.sheets) {
    const ser = wb.hf.getSheetSerialized(s.id)
    const val = wb.hf.getSheetValues(s.id)
    const ws = {}
    let maxR = 0
    let maxC = 0
    ser.forEach((row, r) =>
      row.forEach((raw, c) => {
        if (raw == null || raw === '') return
        const v = val[r][c]
        const isF = typeof raw === 'string' && raw[0] === '='
        let cell
        if (isF) {
          const f = raw.slice(1)
          if (typeof v === 'number') cell = { t: 'n', v, f }
          else if (typeof v === 'boolean') cell = { t: 'b', v, f }
          else cell = { t: 's', v: v && typeof v === 'object' ? v.value : String(v ?? ''), f }
        } else if (typeof raw === 'number') cell = { t: 'n', v: raw }
        else if (typeof raw === 'boolean') cell = { t: 'b', v: raw }
        else cell = { t: 's', v: String(raw) }
        ws[XLSX.utils.encode_cell({ r, c })] = cell
        if (r > maxR) maxR = r
        if (c > maxC) maxC = c
      })
    )
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } })
    const w = wb.widths.get(s.id) ?? {}
    ws['!cols'] = Array.from({ length: maxC + 1 }, (_, i) => (w[i] ? { wpx: w[i] } : {}))
    XLSX.utils.book_append_sheet(book, ws, s.name)
  }
  const data = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
  download(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'engisuite.xlsx')
}

export function exportCsv(wb) {
  const val = wb.hf.getSheetValues(wb.active)
  const esc = (t) => (/[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t)
  const text = val.map((row) => row.map((v) => esc(v == null ? '' : plain(v))).join(';')).join('\r\n')
  const name = wb.sheets.find((s) => s.id === wb.active)?.name ?? 'planilha'
  download(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }), `${name}.csv`)
}
