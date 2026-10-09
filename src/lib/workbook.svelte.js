import { HyperFormula } from 'hyperformula'
import { load, save } from './store.js'
import { registrarExtras } from './custom.js'
import { paraLocal } from './formulas.js'
import { sampleData, sampleName, sampleWidths } from './sample.js'
import { DEF_W, MAXR, MAXC, addr, clamp, parseInput, plain } from './util.js'

const KEY = 'workbook-v1'

registrarExtras()

class Workbook {
  hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3', useColumnIndex: true, maxRows: MAXR, maxColumns: MAXC })
  sheets = $state([])
  active = $state(0)
  rev = $state(0)
  widthRev = $state(0)
  status = $state('salvo')
  biblioteca = $state(false)
  ready = $state(false)
  sel = $state({ ar: 0, ac: 0, fr: 0, fc: 0 })
  edit = $state(null)
  widths = new Map()
  clipText = null
  clipDims = null
  timer = 0
  focusGrid = () => {}
  reveal = () => {}

  async init() {
    let saved = null
    try {
      saved = await load(KEY)
    } catch {
      saved = null
    }
    if (saved?.order?.length) {
      for (const name of saved.order) {
        this.hf.addSheet(name)
        const id = this.hf.getSheetId(name)
        this.hf.setSheetContent(id, saved.sheets[name] ?? [[]])
        this.widths.set(id, saved.widths?.[name] ?? {})
      }
      this.syncSheets()
      const keep = this.hf.getSheetId(saved.active ?? '')
      if (keep != null) this.active = keep
    } else {
      this.hf.addSheet(sampleName)
      const id = this.hf.getSheetId(sampleName)
      this.hf.setSheetContent(id, sampleData)
      this.widths.set(id, { ...sampleWidths })
      this.syncSheets()
      this.active = id
    }
    this.hf.clearUndoStack()
    this.ready = true
    this.rev++
  }

  syncSheets() {
    this.sheets = this.hf.getSheetNames().map((name) => ({ id: this.hf.getSheetId(name), name }))
    if (this.sheets.length && !this.sheets.some((s) => s.id === this.active)) this.active = this.sheets[0].id
  }

  get dims() {
    if (!this.ready) return { width: 0, height: 0 }
    return this.hf.getSheetDimensions(this.active)
  }

  get box() {
    const { ar, ac, fr, fc } = this.sel
    return { r1: Math.min(ar, fr), r2: Math.max(ar, fr), c1: Math.min(ac, fc), c2: Math.max(ac, fc) }
  }

  get multi() {
    const { ar, ac, fr, fc } = this.sel
    return ar !== fr || ac !== fc
  }

  select(ar, ac, fr, fc) {
    this.sel.ar = ar
    this.sel.ac = ac
    this.sel.fr = fr
    this.sel.fc = fc
  }

  cellValue(r, c) {
    if (!this.ready) return null
    return this.hf.getCellValue({ sheet: this.active, row: r, col: c })
  }

  raw(r, c) {
    if (!this.ready) return ''
    const v = this.hf.getCellSerialized({ sheet: this.active, row: r, col: c })
    if (v == null) return ''
    if (typeof v === 'number') return String(v).replace('.', ',')
    // decimais digitados com vírgula são guardados como texto "1.5" e lidos como número pelo motor
    if (typeof v === 'string' && /^-?\d+\.\d+$/.test(v) && typeof this.cellValue(r, c) === 'number') return v.replace('.', ',')
    return paraLocal(String(v))
  }

  colWidth(c) {
    return this.widths.get(this.active)?.[c] ?? DEF_W
  }

  setWidth(c, w) {
    let m = this.widths.get(this.active)
    if (!m) {
      m = {}
      this.widths.set(this.active, m)
    }
    m[c] = w
    this.widthRev++
  }

  touch() {
    this.rev++
    this.scheduleSave()
  }

  startEdit(mode, text) {
    this.edit = { mode, text, orig: this.raw(this.sel.ar, this.sel.ac) }
  }

  commitEdit(dr = 0, dc = 0) {
    const e = this.edit
    if (!e) return
    this.edit = null
    const { ar, ac } = this.sel
    if (e.text !== e.orig) this.setCell(ar, ac, e.text)
    if (dr || dc) {
      const r = clamp(ar + dr, 0, MAXR - 1)
      const c = clamp(ac + dc, 0, MAXC - 1)
      this.select(r, c, r, c)
      this.reveal(r, c)
    }
  }

  cancelEdit() {
    this.edit = null
  }

  setCell(r, c, text) {
    this.hf.setCellContents({ sheet: this.active, row: r, col: c }, [[parseInput(text)]])
    this.touch()
  }

  clampedBox() {
    const b = this.box
    const d = this.dims
    return { r1: b.r1, c1: b.c1, r2: Math.min(b.r2, d.height - 1), c2: Math.min(b.c2, d.width - 1) }
  }

  clearSel() {
    const b = this.clampedBox()
    if (b.r2 < b.r1 || b.c2 < b.c1) return
    const blank = Array.from({ length: b.r2 - b.r1 + 1 }, () => Array(b.c2 - b.c1 + 1).fill(null))
    this.hf.setCellContents({ sheet: this.active, row: b.r1, col: b.c1 }, blank)
    this.touch()
  }

  copySel(cut) {
    const b = this.clampedBox()
    if (b.r2 < b.r1 || b.c2 < b.c1) return ''
    const range = { start: { sheet: this.active, row: b.r1, col: b.c1 }, end: { sheet: this.active, row: b.r2, col: b.c2 } }
    const values = cut ? this.hf.cut(range) : this.hf.copy(range)
    this.clipDims = { rows: b.r2 - b.r1 + 1, cols: b.c2 - b.c1 + 1 }
    this.clipText = values.map((row) => row.map(plain).join('\t')).join('\n')
    return this.clipText
  }

  pasteText(text) {
    const { r1, c1 } = this.box
    const target = { sheet: this.active, row: r1, col: c1 }
    let dims = null
    if (text === this.clipText && !this.hf.isClipboardEmpty()) {
      try {
        this.hf.paste(target)
        dims = this.clipDims
      } catch {
        dims = null
      }
    }
    if (!dims) {
      const matrix = text
        .replace(/\r\n?/g, '\n')
        .replace(/\n$/, '')
        .split('\n')
        .map((line) => line.split('\t').map(parseInput))
      this.hf.setCellContents(target, matrix)
      dims = { rows: matrix.length, cols: Math.max(...matrix.map((m) => m.length)) }
    }
    this.select(r1, c1, Math.min(r1 + dims.rows - 1, MAXR - 1), Math.min(c1 + dims.cols - 1, MAXC - 1))
    this.touch()
  }

  undo() {
    if (!this.hf.isThereSomethingToUndo()) return
    this.hf.undo()
    this.syncSheets()
    this.touch()
  }

  redo() {
    if (!this.hf.isThereSomethingToRedo()) return
    this.hf.redo()
    this.syncSheets()
    this.touch()
  }

  get canUndo() {
    this.rev
    if (!this.ready) return false
    return this.hf.isThereSomethingToUndo()
  }

  get canRedo() {
    this.rev
    if (!this.ready) return false
    return this.hf.isThereSomethingToRedo()
  }

  stats() {
    this.rev
    const b = this.clampedBox()
    let count = 0
    let sum = 0
    let min = Infinity
    let max = -Infinity
    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        const v = this.cellValue(r, c)
        if (typeof v === 'number') {
          count++
          sum += v
          if (v < min) min = v
          if (v > max) max = v
        }
      }
    }
    return { count, sum, avg: count ? sum / count : 0, min, max }
  }

  uniqueName(base) {
    const root = (base || 'Planilha').slice(0, 31)
    let name = root
    let n = 2
    while (this.hf.doesSheetExist(name)) name = `${root.slice(0, 27)} (${n++})`
    return name
  }

  addSheet() {
    let n = this.sheets.length + 1
    while (this.hf.doesSheetExist(`Planilha${n}`)) n++
    return this.addSheetData(`Planilha${n}`, [[]], {}, true)
  }

  addSheetData(name, matrix, widths = {}, activate = false) {
    const final = this.uniqueName(name)
    this.hf.addSheet(final)
    const id = this.hf.getSheetId(final)
    this.hf.setSheetContent(id, matrix.length ? matrix : [[]])
    this.widths.set(id, widths)
    this.syncSheets()
    if (activate) this.setActive(id)
    this.touch()
    return final
  }

  setActive(id) {
    this.edit = null
    this.active = id
    this.select(0, 0, 0, 0)
    this.rev++
    this.scheduleSave()
  }

  setActiveByName(name) {
    const id = this.hf.getSheetId(name)
    if (id != null) this.setActive(id)
  }

  removeSheet(id) {
    if (this.sheets.length < 2) return
    this.hf.removeSheet(id)
    this.widths.delete(id)
    this.syncSheets()
    this.setActive(this.sheets[0].id)
    this.touch()
  }

  renameSheet(id, name) {
    const next = name.trim().slice(0, 31)
    const cur = this.sheets.find((s) => s.id === id)
    if (!cur || !next || next === cur.name) return false
    if (this.sheets.some((s) => s.id !== id && s.name.toLowerCase() === next.toLowerCase())) return false
    this.hf.renameSheet(id, next)
    this.syncSheets()
    this.touch()
    return true
  }

  scheduleSave() {
    this.status = 'salvando'
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.persist(), 700)
  }

  async persist() {
    try {
      const snapshot = { order: [], sheets: {}, widths: {}, active: '' }
      for (const s of this.sheets) {
        snapshot.order.push(s.name)
        snapshot.sheets[s.name] = this.hf.getSheetSerialized(s.id)
        snapshot.widths[s.name] = { ...(this.widths.get(s.id) ?? {}) }
        if (s.id === this.active) snapshot.active = s.name
      }
      await save(KEY, snapshot)
      this.status = 'salvo'
    } catch {
      this.status = 'erro'
    }
  }

  get label() {
    const { r1, c1, r2, c2 } = this.box
    const a = addr(r1, c1)
    return r1 === r2 && c1 === c2 ? a : `${a}:${addr(r2, c2)}`
  }
}

export const wb = new Workbook()
