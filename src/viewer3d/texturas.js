// Texturas procedurais em tons claros: a cor do material multiplica a textura, então o mesmo desenho serve para várias cores.
import * as THREE from 'three'

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const N = 256
const cinza = (v) => `rgb(${v},${v},${v})`

const DESENHOS = {
  ruido(c, r) {
    c.fillStyle = cinza(228)
    c.fillRect(0, 0, N, N)
    for (let i = 0; i < 5000; i++) {
      c.fillStyle = cinza(196 + Math.floor(r() * 56))
      c.fillRect(r() * N, r() * N, 1 + r() * 2, 1 + r() * 2)
    }
  },
  grama(c, r) {
    c.fillStyle = cinza(222)
    c.fillRect(0, 0, N, N)
    for (let i = 0; i < 2600; i++) {
      const x = r() * N
      const y = r() * N
      c.strokeStyle = cinza(170 + Math.floor(r() * 86))
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(x, y)
      c.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 5)
      c.stroke()
    }
  },
  tabua(c, r) {
    const n = 6
    const h = N / n
    for (let i = 0; i < n; i++) {
      c.fillStyle = cinza(214 + Math.floor(r() * 36))
      c.fillRect(0, i * h, N, h)
      for (let k = 0; k < 14; k++) {
        c.strokeStyle = cinza(180 + Math.floor(r() * 40))
        c.beginPath()
        const y = i * h + 3 + r() * (h - 6)
        c.moveTo(0, y)
        c.lineTo(N, y + (r() - 0.5) * 3)
        c.stroke()
      }
      c.fillStyle = cinza(110)
      c.fillRect(0, i * h, N, 2)
    }
  },
  pedra(c, r) {
    c.fillStyle = cinza(120)
    c.fillRect(0, 0, N, N)
    const linhas = 4
    const h = N / linhas
    for (let i = 0; i < linhas; i++) {
      let x = -r() * 40
      while (x < N) {
        const w = 50 + r() * 60
        c.fillStyle = cinza(206 + Math.floor(r() * 46))
        c.fillRect(x + 2, i * h + 2, w - 4, h - 4)
        x += w
      }
    }
  },
  ceramica(c, r) {
    c.fillStyle = cinza(150)
    c.fillRect(0, 0, N, N)
    const n = 2
    const s = N / n
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        c.fillStyle = cinza(228 + Math.floor(r() * 24))
        c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4)
      }
  },
  agua(c, r) {
    c.fillStyle = cinza(240)
    c.fillRect(0, 0, N, N)
    c.lineWidth = 2
    for (let i = 0; i < 14; i++) {
      c.strokeStyle = cinza(205 + Math.floor(r() * 30))
      c.beginPath()
      const y0 = (i / 14) * N
      for (let x = 0; x <= N; x += 8) c.lineTo(x, y0 + Math.sin(x / 22 + i) * 5)
      c.stroke()
    }
  },
  tijolo(c, r) {
    c.fillStyle = cinza(190)
    c.fillRect(0, 0, N, N)
    const linhas = 8
    const h = N / linhas
    for (let i = 0; i < linhas; i++) {
      const w = N / 4
      for (let j = -1; j < 5; j++) {
        c.fillStyle = cinza(212 + Math.floor(r() * 40))
        c.fillRect(j * w + (i % 2 ? w / 2 : 0) + 2, i * h + 2, w - 4, h - 4)
      }
    }
  },
  folhagem(c, r) {
    c.fillStyle = cinza(205)
    c.fillRect(0, 0, N, N)
    for (let i = 0; i < 700; i++) {
      c.fillStyle = cinza(150 + Math.floor(r() * 105))
      c.beginPath()
      c.arc(r() * N, r() * N, 2 + r() * 6, 0, Math.PI * 2)
      c.fill()
    }
  }
}

const cache = new Map()

export function textura(nome, renderer) {
  if (!DESENHOS[nome]) return null
  if (cache.has(nome)) return cache.get(nome)
  const cv = document.createElement('canvas')
  cv.width = cv.height = N
  DESENHOS[nome](cv.getContext('2d'), rng(nome.length * 7919 + nome.charCodeAt(0)))
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() ?? 1)
  cache.set(nome, t)
  return t
}

export const NOMES_TEXTURA = Object.keys(DESENHOS)
export function liberarTexturas() {
  for (const t of cache.values()) t.dispose()
  cache.clear()
}
