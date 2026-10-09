import { load, save } from '../lib/store.js'
import { bboxAll } from './geom.js'

const KEY = 'cad-v1'
let n = 0
export const uid = () => `e${Date.now().toString(36)}${(n++).toString(36)}`

class Drawing {
  ents = $state([])
  layers = $state([
    { name: '0', color: 7, visible: true },
    { name: 'PAREDES', color: 3, visible: true },
    { name: 'COTAS', color: 2, visible: true },
    { name: 'TEXTOS', color: 4, visible: true }
  ])
  layer = $state('PAREDES')
  sel = $state([])
  rev = $state(0)
  view = $state({ cx: 0, cy: 0, k: 40 }) // k = pixels por unidade
  grid = $state(0.5)
  ortho = $state(false)
  snapGrid = $state(true)
  snapObj = $state(true)
  textH = $state(0.2)
  unidade = $state('m')
  status = $state('salvo')
  undoStack = []
  redoStack = []
  timer = 0
  ready = false

  async init() {
    try {
      const s = await load(KEY)
      if (s?.ents) {
        this.ents = s.ents
        this.layers = s.layers?.length ? s.layers : this.layers
        this.layer = s.layer ?? this.layer
        this.view = s.view ?? this.view
        this.grid = s.grid ?? this.grid
        this.unidade = s.unidade ?? this.unidade
      }
    } catch {}
    this.ready = true
    this.rev++
  }

  snapshot() {
    return JSON.stringify({ ents: this.ents, layers: this.layers })
  }

  // chamar ANTES de alterar o desenho
  push() {
    this.undoStack.push(this.snapshot())
    if (this.undoStack.length > 200) this.undoStack.shift()
    this.redoStack = []
  }

  restore(json) {
    const s = JSON.parse(json)
    this.ents = s.ents
    this.layers = s.layers
    this.sel = this.sel.filter((id) => this.ents.some((e) => e.id === id))
    this.changed()
  }

  undo() {
    const s = this.undoStack.pop()
    if (!s) return
    this.redoStack.push(this.snapshot())
    this.restore(s)
  }

  redo() {
    const s = this.redoStack.pop()
    if (!s) return
    this.undoStack.push(this.snapshot())
    this.restore(s)
  }

  changed() {
    this.rev++
    this.status = 'salvando'
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.persist(), 600)
  }

  async persist() {
    try {
      await save(KEY, { ents: $state.snapshot(this.ents), layers: $state.snapshot(this.layers), layer: this.layer, view: $state.snapshot(this.view), grid: this.grid, unidade: this.unidade })
      this.status = 'salvo'
    } catch {
      this.status = 'erro'
    }
  }

  layerOf(name) {
    return this.layers.find((l) => l.name === name)
  }

  visible(e) {
    return this.layerOf(e.layer)?.visible !== false
  }

  add(...es) {
    this.push()
    for (const e of es) this.ents.push({ id: uid(), layer: this.layer, ...e })
    this.changed()
  }

  replaceMany(map) {
    // map: id -> nova entidade
    this.push()
    this.ents = this.ents.map((e) => map.get(e.id) ?? e)
    this.changed()
  }

  removeSel() {
    if (!this.sel.length) return
    this.push()
    this.ents = this.ents.filter((e) => !this.sel.includes(e.id))
    this.sel = []
    this.changed()
  }

  addLayer(name) {
    const nm = name.trim().toUpperCase().slice(0, 31)
    if (!nm || this.layers.some((l) => l.name === nm)) return false
    this.push()
    this.layers.push({ name: nm, color: (this.layers.length % 7) + 1, visible: true })
    this.layer = nm
    this.changed()
    return true
  }

  setLayerProp(name, prop, v) {
    const l = this.layerOf(name)
    if (!l) return
    this.push()
    l[prop] = v
    this.changed()
  }

  moveSelToLayer() {
    if (!this.sel.length) return
    this.push()
    this.ents = this.ents.map((e) => (this.sel.includes(e.id) ? { ...e, layer: this.layer } : e))
    this.changed()
  }

  replaceAll(ents, layers) {
    this.push()
    this.ents = ents
    this.layers = layers
    if (!layers.some((l) => l.name === this.layer)) this.layer = layers[0].name
    this.sel = []
    this.changed()
  }

  extents(w, h) {
    const b = bboxAll(this.ents.filter((e) => this.visible(e)))
    if (!b) {
      this.view = { cx: 0, cy: 0, k: 40 }
      return
    }
    const bw = Math.max(b.x2 - b.x1, 1e-6)
    const bh = Math.max(b.y2 - b.y1, 1e-6)
    this.view = { cx: (b.x1 + b.x2) / 2, cy: (b.y1 + b.y2) / 2, k: Math.min((w * 0.9) / bw, (h * 0.9) / bh) }
  }
}

export const drawing = new Drawing()
