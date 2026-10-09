import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CATALOGO } from './catalog.js'
import { grade, limitar } from './layout.js'

const RAD = Math.PI / 180

function corDe(cor, base) {
  const c = new THREE.Color(base)
  if (cor === 'main') return c
  if (cor === 'dark') return c.multiplyScalar(0.55)
  if (cor === 'light') return c.lerp(new THREE.Color('#ffffff'), 0.3)
  return new THREE.Color(cor)
}

export class Cena {
  constructor(canvas, cb = {}) {
    this.canvas = canvas
    this.cb = cb
    this.sala = { w: 4, d: 3, h: 2.7, cParede: '#e9e5de', cPiso: '#b8a58c' }
    this.itens = new Map() // id -> { item, grupo, sig }
    this.sel = null
    this.cols = new Set()
    this.grade = 0.05
    this.modoParedes = 'auto'
    this.drag = null

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#14130f')
    this.persp = new THREE.PerspectiveCamera(45, 1, 0.05, 200)
    this.ortho = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.05, 200)
    this.cam = this.persp
    this.controls = new OrbitControls(this.cam, canvas)
    this.controls.enableDamping = true
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02
    this.controls.addEventListener('change', () => this.pedir())

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x777066, 0.9))
    this.sol = new THREE.DirectionalLight(0xffffff, 1.1)
    this.sol.castShadow = true
    this.sol.shadow.mapSize.set(2048, 2048)
    this.sol.shadow.bias = -0.0004
    this.scene.add(this.sol, this.sol.target)

    this.raiz = new THREE.Group()
    this.salaGrupo = new THREE.Group()
    this.scene.add(this.raiz, this.salaGrupo)
    this.ray = new THREE.Raycaster()
    this.plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

    this._down = (e) => this.aoPressionar(e)
    this._move = (e) => this.aoMover(e)
    this._up = (e) => this.aoSoltar(e)
    canvas.addEventListener('pointerdown', this._down)
    canvas.addEventListener('pointermove', this._move)
    canvas.addEventListener('pointerup', this._up)
    canvas.addEventListener('pointercancel', this._up)

    this.setSala(this.sala)
    this.vista('3d')
    this.pedir()
  }

  pedir() {
    if (this._raf || this.morto) return
    this._raf = requestAnimationFrame(() => {
      this._raf = 0
      this.desenhar()
    })
  }

  desenhar() {
    if (this.morto) return
    this.controls.update()
    this.atualizarParedes()
    this.renderer.render(this.scene, this.cam)
    if (this.controls.enableDamping && this._amortecendo) this.pedir()
  }

  tamanho(w, h) {
    this.w = Math.max(w, 10)
    this.h = Math.max(h, 10)
    this.renderer.setSize(this.w, this.h, false)
    const a = this.w / this.h
    this.persp.aspect = a
    this.persp.updateProjectionMatrix()
    this.ajustarOrtho()
    this.pedir()
  }

  ajustarOrtho() {
    const R = Math.max(this.sala.w, this.sala.d, this.sala.h) * 0.9
    const a = (this.w ?? 1) / (this.h ?? 1)
    this.ortho.left = -R * a
    this.ortho.right = R * a
    this.ortho.top = R
    this.ortho.bottom = -R
    this.ortho.updateProjectionMatrix()
  }

  setSala(sala) {
    this.sala = { ...this.sala, ...sala }
    const { w, d, h } = this.sala
    this.salaGrupo.traverse((o) => {
      o.geometry?.dispose()
      o.material?.dispose?.()
    })
    this.salaGrupo.clear()
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: this.sala.cPiso, roughness: 0.9 }))
    piso.rotation.x = -Math.PI / 2
    piso.position.set(w / 2, 0, d / 2)
    piso.receiveShadow = true
    this.salaGrupo.add(piso)
    const grid = new THREE.GridHelper(Math.max(w, d), Math.round(Math.max(w, d) / 0.5), 0x000000, 0x000000)
    grid.material.opacity = 0.12
    grid.material.transparent = true
    grid.position.set(w / 2, 0.002, d / 2)
    this.salaGrupo.add(grid)
    const t = 0.1
    const mat = () => new THREE.MeshStandardMaterial({ color: this.sala.cParede, roughness: 1, side: THREE.DoubleSide })
    const def = [
      ['norte', w + 2 * t, t, w / 2, -t / 2, 0, 0, -1],
      ['sul', w + 2 * t, t, w / 2, d + t / 2, 0, 0, 1],
      ['oeste', t, d, -t / 2, d / 2, 0, -1, 0],
      ['leste', t, d, w + t / 2, d / 2, 0, 1, 0]
    ]
    this.paredes = def.map(([nome, sx, sz, x, z, , nx, nz]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), mat())
      m.position.set(x, h / 2, z)
      m.castShadow = true
      m.receiveShadow = true
      m.userData = { nome, nx, nz, plano: nx !== 0 ? (nx > 0 ? w : 0) : nz > 0 ? d : 0 }
      this.salaGrupo.add(m)
      return m
    })
    const R = Math.max(w, d)
    this.sol.position.set(w * 0.3, h * 3, d * 0.2)
    this.sol.target.position.set(w / 2, 0, d / 2)
    const s = this.sol.shadow.camera
    s.left = -R
    s.right = R
    s.top = R
    s.bottom = -R
    s.near = 0.5
    s.far = h * 8 + R
    s.updateProjectionMatrix()
    this.ajustarOrtho()
    this.pedir()
  }

  setParedes(modo) {
    this.modoParedes = modo
    this.pedir()
  }

  atualizarParedes() {
    if (!this.paredes) return
    const c = this.cam.position
    for (const p of this.paredes) {
      const { nx, nz, plano } = p.userData
      if (this.modoParedes === 'todas') p.visible = true
      else if (this.modoParedes === 'nenhuma') p.visible = false
      else {
        // oculta a parede que fica entre a câmera e o cômodo
        const fora = nx !== 0 ? (c.x - plano) * nx > 0 : (c.z - plano) * nz > 0
        p.visible = !fora
      }
    }
  }

  setGrade(g) {
    this.grade = g
  }

  vista(nome) {
    const { w, d, h } = this.sala
    const R = Math.max(w, d, h)
    const c = new THREE.Vector3(w / 2, 0, d / 2)
    const t = { '3d': [c.x + R * 1.0, R * 1.25, c.z + R * 1.5], planta: [c.x, R * 2.4, c.z + 0.001], frente: [c.x, h * 0.5, c.z + R * 2.2], lado: [c.x + R * 2.2, h * 0.5, c.z] }[nome] ?? [c.x + R, R, c.z + R]
    this.cam.position.set(...t)
    this.controls.target.set(c.x, nome === 'frente' || nome === 'lado' ? h * 0.4 : 0, c.z)
    this.cam.zoom = 1
    this.cam.updateProjectionMatrix()
    this.controls.update()
    this.pedir()
  }

  setOrtho(on) {
    const nova = on ? this.ortho : this.persp
    if (nova === this.cam) return
    nova.position.copy(this.cam.position)
    nova.quaternion.copy(this.cam.quaternion)
    nova.zoom = 1
    nova.updateProjectionMatrix()
    this.cam = nova
    this.controls.object = nova
    this.controls.update()
    this.pedir()
  }

  assinatura(it) {
    return [it.tipo, it.w, it.d, it.h, it.cor].join('|')
  }

  construir(it) {
    const def = CATALOGO[it.tipo]
    const g = new THREE.Group()
    for (const p of def.partes(it.w, it.d, it.h)) {
      const geo = p.t === 'box' ? new THREE.BoxGeometry(p.sx, p.sy, p.sz) : new THREE.CylinderGeometry(p.r, p.r, p.sy, 24)
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: corDe(p.cor, it.cor), roughness: 0.75, metalness: 0.02 }))
      m.position.set(p.x, p.y, p.z)
      m.castShadow = !def.fantasma
      m.receiveShadow = true
      g.add(m)
    }
    return g
  }

  descartar(g) {
    g.traverse((o) => {
      o.geometry?.dispose()
      o.material?.dispose?.()
    })
    this.raiz.remove(g)
  }

  setItens(items, sel, cols) {
    this.sel = sel
    this.cols = cols ?? new Set()
    const ids = new Set(items.map((i) => i.id))
    for (const [id, o] of this.itens) {
      if (!ids.has(id)) {
        this.descartar(o.grupo)
        this.itens.delete(id)
      }
    }
    for (const it of items) {
      let o = this.itens.get(it.id)
      const sig = this.assinatura(it)
      if (!o || o.sig !== sig) {
        if (o) this.descartar(o.grupo)
        const grupo = this.construir(it)
        grupo.userData.id = it.id
        this.raiz.add(grupo)
        o = { grupo, sig }
        this.itens.set(it.id, o)
      }
      o.item = it
      o.grupo.position.set(it.x, it.elev ?? 0, it.z)
      o.grupo.rotation.y = -it.rot * RAD
      const ev = it.id === sel ? 0x2a4a80 : this.cols.has(it.id) ? 0x7a1f1f : 0x000000
      o.grupo.traverse((m) => m.material?.emissive?.setHex(ev))
    }
    this.pedir()
  }

  // ---------- interação ----------
  ndc(e) {
    const r = this.canvas.getBoundingClientRect()
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  }

  aoPressionar(e) {
    if (e.button !== 0) return
    this.ray.setFromCamera(this.ndc(e), this.cam)
    const alvos = this.raiz.children
    const hit = this.ray.intersectObjects(alvos, true)[0]
    let g = hit?.object
    while (g && !g.userData.id) g = g.parent
    if (!g) {
      this.cb.onSelect?.(null)
      return
    }
    const id = g.userData.id
    this.cb.onSelect?.(id)
    const o = this.itens.get(id)
    const ponto = new THREE.Vector3()
    this.plano.constant = -(o.item.elev ?? 0)
    if (this.ray.ray.intersectPlane(this.plano, ponto)) {
      this.drag = { id, dx: o.item.x - ponto.x, dz: o.item.z - ponto.z, moveu: false }
      this.controls.enabled = false
      this.canvas.setPointerCapture(e.pointerId)
    }
  }

  aoMover(e) {
    if (!this.drag) return
    this.ray.setFromCamera(this.ndc(e), this.cam)
    const ponto = new THREE.Vector3()
    const o = this.itens.get(this.drag.id)
    if (!o || !this.ray.ray.intersectPlane(this.plano, ponto)) return
    let it = { ...o.item, x: grade(ponto.x + this.drag.dx, this.grade), z: grade(ponto.z + this.drag.dz, this.grade) }
    it = limitar(it, this.sala)
    this.drag.moveu = true
    this.cb.onDrag?.(it.id, it.x, it.z)
  }

  aoSoltar(e) {
    if (this.drag) {
      if (this.drag.moveu) this.cb.onDragEnd?.(this.drag.id)
      this.drag = null
      this.controls.enabled = true
      try {
        this.canvas.releasePointerCapture(e.pointerId)
      } catch {}
    }
  }

  captura() {
    this.renderer.render(this.scene, this.cam)
    return this.canvas.toDataURL('image/png')
  }

  dispose() {
    this.morto = true
    cancelAnimationFrame(this._raf)
    this.canvas.removeEventListener('pointerdown', this._down)
    this.canvas.removeEventListener('pointermove', this._move)
    this.canvas.removeEventListener('pointerup', this._up)
    this.canvas.removeEventListener('pointercancel', this._up)
    this.controls.dispose()
    this.scene.traverse((o) => {
      o.geometry?.dispose()
      o.material?.dispose?.()
    })
    this.renderer.dispose()
  }
}
