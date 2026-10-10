import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CATALOGO, SOLOS } from './catalog.js'
import { grade, limitar } from './layout.js'
import { textura } from './texturas.js'

const RAD = Math.PI / 180
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

function corDe(cor, base) {
  const c = new THREE.Color(base)
  if (cor === 'main') return c
  if (cor === 'dark') return c.multiplyScalar(0.55)
  if (cor === 'light') return c.lerp(new THREE.Color('#ffffff'), 0.3)
  return new THREE.Color(cor)
}

// UVs em escala física: a textura se repete a cada `tile` metros em todas as faces da caixa
function uvFisico(geo, sx, sy, sz, tile) {
  const uv = geo.attributes.uv
  const faces = [
    [sz, sy], [sz, sy], // ±x
    [sx, sz], [sx, sz], // ±y
    [sx, sy], [sx, sy] // ±z
  ]
  for (let f = 0; f < 6; f++) {
    const [fw, fh] = faces[f]
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k
      uv.setXY(i, (uv.getX(i) * fw) / tile, (uv.getY(i) * fh) / tile)
    }
  }
  uv.needsUpdate = true
}

export class Cena {
  constructor(canvas, cb = {}) {
    this.canvas = canvas
    this.cb = cb
    this.sala = { modo: 'interno', w: 4, d: 3, h: 2.7, cParede: '#e9e5de', cPiso: '#b8a58c', solo: 'grama' }
    this.hora = 14
    this.itens = new Map()
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
    this.persp = new THREE.PerspectiveCamera(45, 1, 0.05, 1500)
    this.ortho = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.05, 1500)
    this.cam = this.persp
    this.controls = new OrbitControls(this.cam, canvas)
    this.controls.enableDamping = true
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02
    this.controls.addEventListener('change', () => this.pedir())

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x777066, 0.9)
    this.sol = new THREE.DirectionalLight(0xffffff, 1.1)
    this.sol.castShadow = true
    this.sol.shadow.mapSize.set(2048, 2048)
    this.sol.shadow.bias = -0.0004
    this.scene.add(this.hemi, this.sol, this.sol.target)

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
  }

  tamanho(w, h) {
    this.w = Math.max(w, 10)
    this.h = Math.max(h, 10)
    this.renderer.setSize(this.w, this.h, false)
    this.persp.aspect = this.w / this.h
    this.persp.updateProjectionMatrix()
    this.ajustarOrtho()
    this.pedir()
  }

  extensao() {
    const { w, d, h } = this.sala
    return this.sala.modo === 'externo' ? Math.max(w, d) : Math.max(w, d, h)
  }

  ajustarOrtho() {
    const R = this.extensao() * 0.9
    const a = (this.w ?? 1) / (this.h ?? 1)
    this.ortho.left = -R * a
    this.ortho.right = R * a
    this.ortho.top = R
    this.ortho.bottom = -R
    this.ortho.updateProjectionMatrix()
  }

  limparSala() {
    this.salaGrupo.traverse((o) => {
      o.geometry?.dispose()
      if (o.material) {
        o.material.map?.dispose?.()
        o.material.dispose?.()
      }
    })
    this.salaGrupo.clear()
  }

  setSala(sala) {
    this.sala = { ...this.sala, ...sala }
    const { w, d, h, modo } = this.sala
    this.limparSala()
    this.paredes = []
    if (modo === 'externo') this.montarTerreno()
    else this.montarComodo()
    this.atualizarSol()
    this.ajustarOrtho()
    this.pedir()
  }

  montarComodo() {
    const { w, d, h } = this.sala
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
      ['norte', w + 2 * t, t, w / 2, -t / 2, 0, -1],
      ['sul', w + 2 * t, t, w / 2, d + t / 2, 0, 1],
      ['oeste', t, d, -t / 2, d / 2, -1, 0],
      ['leste', t, d, w + t / 2, d / 2, 1, 0]
    ]
    this.paredes = def.map(([nome, sx, sz, x, z, nx, nz]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), mat())
      m.position.set(x, h / 2, z)
      m.castShadow = true
      m.receiveShadow = true
      m.userData = { nome, nx, nz, plano: nx !== 0 ? (nx > 0 ? w : 0) : nz > 0 ? d : 0 }
      this.salaGrupo.add(m)
      return m
    })
  }

  montarTerreno() {
    const { w, d } = this.sala
    const solo = SOLOS[this.sala.solo] ?? SOLOS.grama
    const repetir = (t, rx, ry) => {
      const c = t.clone()
      c.needsUpdate = true
      c.repeat.set(rx, ry)
      return c
    }
    const base = textura(solo.tex, this.renderer)
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: solo.cor, map: base ? repetir(base, w / solo.tile, d / solo.tile) : null, roughness: 1 }))
    chao.rotation.x = -Math.PI / 2
    chao.position.set(w / 2, 0, d / 2)
    chao.receiveShadow = true
    this.salaGrupo.add(chao)
    // entorno: terreno vizinho, mais escuro, para dar noção de escala
    const G = 600
    const gt = textura('grama', this.renderer)
    const fora = new THREE.Mesh(new THREE.PlaneGeometry(G, G), new THREE.MeshStandardMaterial({ color: '#6c8650', map: gt ? repetir(gt, G / 3, G / 3) : null, roughness: 1 }))
    fora.rotation.x = -Math.PI / 2
    fora.position.set(w / 2, -0.03, d / 2)
    fora.receiveShadow = true
    this.salaGrupo.add(fora)
    // divisa do lote
    const mat = new THREE.MeshStandardMaterial({ color: '#e5dfd0', roughness: 0.9 })
    const e = 0.12
    for (const [sx, sz, x, z] of [[w + 2 * e, e, w / 2, -e / 2], [w + 2 * e, e, w / 2, d + e / 2], [e, d, -e / 2, d / 2], [e, d, w + e / 2, d / 2]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.1, sz), mat)
      m.position.set(x, 0.05, z)
      m.receiveShadow = true
      this.salaGrupo.add(m)
    }
  }

  setHora(h) {
    this.hora = h
    this.atualizarSol()
    this.pedir()
  }

  atualizarSol() {
    const { w, d, modo } = this.sala
    const R = Math.max(w, d)
    const t = clamp((this.hora - 6) / 12, 0, 1)
    const alt = Math.sin(Math.PI * t)
    const el = Math.max(0.1, alt) * 1.25
    const az = Math.PI * (1 - t)
    const dir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), 0.45 * Math.cos(el)).normalize()
    this.sol.position.set(w / 2 + dir.x * R * 2, dir.y * R * 2 + 2, d / 2 + dir.z * R * 2)
    this.sol.target.position.set(w / 2, 0, d / 2)
    this.sol.color.set('#ff9a4d').lerp(new THREE.Color('#fff6e6'), Math.min(1, alt * 1.6))
    this.sol.intensity = 0.35 + 0.95 * alt
    this.hemi.intensity = 0.4 + 0.5 * alt
    const s = this.sol.shadow.camera
    const E = R * 0.9 + 4
    s.left = -E
    s.right = E
    s.top = E
    s.bottom = -E
    s.near = 0.5
    s.far = R * 6 + 30
    s.updateProjectionMatrix()
    this.scene.background = new THREE.Color(modo === 'externo' ? new THREE.Color('#26324d').lerp(new THREE.Color('#9fcdf0'), Math.min(1, alt * 1.4)) : '#14130f')
  }

  setParedes(modo) {
    this.modoParedes = modo
    this.pedir()
  }

  atualizarParedes() {
    if (!this.paredes?.length) return
    const c = this.cam.position
    for (const p of this.paredes) {
      const { nx, nz, plano } = p.userData
      if (this.modoParedes === 'todas') p.visible = true
      else if (this.modoParedes === 'nenhuma') p.visible = false
      else p.visible = !(nx !== 0 ? (c.x - plano) * nx > 0 : (c.z - plano) * nz > 0)
    }
  }

  setGrade(g) {
    this.grade = g
  }

  vista(nome) {
    const { w, d, h } = this.sala
    const ext = this.sala.modo === 'externo'
    const R = this.extensao() * (ext ? 0.78 : 1)
    const c = new THREE.Vector3(w / 2, 0, d / 2)
    const hh = ext ? Math.min(R * 0.25, 8) : h
    const t = { '3d': [c.x + R * 1.0, R * 1.25, c.z + R * 1.5], planta: [c.x, R * 2.4, c.z + 0.001], frente: [c.x, hh * 0.5 + 1.5, c.z + R * 2.2], lado: [c.x + R * 2.2, hh * 0.5 + 1.5, c.z] }[nome] ?? [c.x + R, R, c.z + R]
    this.cam.position.set(...t)
    this.controls.target.set(c.x, nome === 'frente' || nome === 'lado' ? hh * 0.4 : 0, c.z)
    this.controls.maxDistance = R * 8
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
    return [it.tipo, it.w, it.d, it.h, it.cor, JSON.stringify(it.op ?? {})].join('|')
  }

  geometria(p) {
    switch (p.t) {
      case 'box': {
        const g = new THREE.BoxGeometry(p.sx, p.sy, p.sz)
        if (p.tex) uvFisico(g, p.sx, p.sy, p.sz, p.tile || 1)
        return g
      }
      case 'cyl': {
        const g = new THREE.CylinderGeometry(p.r, p.r, p.sy, 20)
        if (p.eixo === 'x') g.rotateZ(Math.PI / 2)
        else if (p.eixo === 'z') g.rotateX(Math.PI / 2)
        return g
      }
      case 'cone':
        return new THREE.ConeGeometry(p.r, p.sy, 24)
      case 'esf':
        return new THREE.SphereGeometry(0.5, 20, 14)
      case 'prisma': {
        const ex = p.cumeeira === 'x'
        const W = ex ? p.sz : p.sx
        const D = ex ? p.sx : p.sz
        const sh = new THREE.Shape()
        sh.moveTo(-W / 2, -p.sy / 2)
        sh.lineTo(W / 2, -p.sy / 2)
        sh.lineTo(0, p.sy / 2)
        sh.closePath()
        const g = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false })
        g.translate(0, 0, -D / 2)
        if (ex) g.rotateY(Math.PI / 2)
        return g
      }
      case 'pir': {
        const g = new THREE.ConeGeometry(1, 1, 4)
        g.rotateY(Math.PI / 4)
        g.scale(p.sx / Math.SQRT2, p.sy, p.sz / Math.SQRT2)
        return g
      }
    }
    return new THREE.BoxGeometry(0.1, 0.1, 0.1)
  }

  construir(it) {
    const def = CATALOGO[it.tipo]
    const g = new THREE.Group()
    for (const p of def.partes(it.w, it.d, it.h, it.op)) {
      const tex = p.tex ? textura(p.tex, this.renderer) : null
      const mat = new THREE.MeshStandardMaterial({ color: corDe(p.cor, it.cor), map: tex, roughness: p.tex === 'agua' ? 0.18 : 0.8, metalness: p.tex === 'agua' ? 0.1 : 0.02 })
      if (def.zona) {
        mat.polygonOffset = true
        mat.polygonOffsetFactor = -1
        mat.polygonOffsetUnits = -1
      }
      const m = new THREE.Mesh(this.geometria(p), mat)
      m.position.set(p.x, p.y, p.z)
      if (p.t === 'esf') m.scale.set(p.sx, p.sy, p.sz)
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
    let z = 0
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
      // zonas empilham em camadas mínimas, na ordem de criação, para não "brigar" visualmente
      const camada = CATALOGO[it.tipo].zona ? ++z * 0.002 : 0
      o.grupo.position.set(it.x, (it.elev ?? 0) + camada, it.z)
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
    const hit = this.ray.intersectObjects(this.raiz.children, true)[0]
    let g = hit?.object
    while (g && !g.userData.id) g = g.parent
    if (!g) {
      this.cb.onSelect?.(null)
      return
    }
    const id = g.userData.id
    const o = this.itens.get(id)
    this.cb.onSelect?.(id)
    // peças de piso grandes só arrastam depois de selecionadas, para não atrapalhar o giro da câmera
    if (CATALOGO[o.item.tipo].zona && this.sel !== id) return
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
    if (!this.drag.moveu && (Math.abs(it.x - o.item.x) > 1e-6 || Math.abs(it.z - o.item.z) > 1e-6)) {
      this.drag.moveu = true
      this.cb.onDragStart?.(it.id)
    }
    if (this.drag.moveu) this.cb.onDrag?.(it.id, it.x, it.z)
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
