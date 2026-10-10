// Catálogo de móveis paramétricos. Dimensões em metros. Cada móvel gera "partes" (caixas e cilindros)
// com origem no centro da base: x (largura), y (altura), z (profundidade).
// cor: 'main' (cor escolhida), 'dark', 'light' ou um hex.

const box = (x, y, z, sx, sy, sz, cor = 'main', tex = null, tile = 1) => ({ t: 'box', x, y, z, sx, sy, sz, cor, tex, tile })
// cilindro vertical (eixo 'y'), ou deitado ao longo de x ou z
const cyl = (x, y, z, r, sy, cor = 'main', eixo = 'y') => ({ t: 'cyl', x, y, z, r, sy, cor, eixo })
// elipsoide: sx, sy, sz são os diâmetros
const esf = (x, y, z, sx, sy, sz, cor = 'main', tex = null) => ({ t: 'esf', x, y, z, sx, sy, sz, cor, tex, tile: 1 })
const cone = (x, y, z, r, sy, cor = 'main') => ({ t: 'cone', x, y, z, r, sy, cor })
// telhado de duas águas: sx × sz na planta, cumeeira ao longo de 'z' ou 'x'
const prisma = (x, y, z, sx, sy, sz, cor = 'main', cumeeira = 'z') => ({ t: 'prisma', x, y, z, sx, sy, sz, cor, cumeeira })
// telhado de quatro águas
const pir = (x, y, z, sx, sy, sz, cor = 'main') => ({ t: 'pir', x, y, z, sx, sy, sz, cor })

// dimensões totais (x, y, z) de uma parte, para conferência e colisão
export function extensao(p) {
  switch (p.t) {
    case 'cyl':
      return p.eixo === 'x' ? { ex: p.sy, ey: p.r * 2, ez: p.r * 2 } : p.eixo === 'z' ? { ex: p.r * 2, ey: p.r * 2, ez: p.sy } : { ex: p.r * 2, ey: p.sy, ez: p.r * 2 }
    case 'cone':
      return { ex: p.r * 2, ey: p.sy, ez: p.r * 2 }
    default:
      return { ex: p.sx, ey: p.sy, ez: p.sz }
  }
}

export const CATALOGO = {
  sofa: {
    nome: 'Sofá', grupo: 'Sala', w: 2, d: 0.9, h: 0.85, cor: '#8a7f73',
    partes: (w, d, h) => [
      box(0, 0.2 * h, 0, w, 0.4 * h, d), // base
      box(0, 0.5 * h, -d * 0.4, w * 0.9, 0.5 * h, d * 0.2), // encosto
      box(-w * 0.45, 0.35 * h, 0, w * 0.1, 0.7 * h, d), // braços
      box(w * 0.45, 0.35 * h, 0, w * 0.1, 0.7 * h, d),
      box(-w * 0.2, 0.45 * h, d * 0.05, w * 0.36, 0.1 * h, d * 0.6, 'light'),
      box(w * 0.2, 0.45 * h, d * 0.05, w * 0.36, 0.1 * h, d * 0.6, 'light')
    ]
  },
  poltrona: {
    nome: 'Poltrona', grupo: 'Sala', w: 0.8, d: 0.8, h: 0.85, cor: '#b0805a',
    partes: (w, d, h) => [box(0, 0.2 * h, 0, w, 0.4 * h, d), box(0, 0.55 * h, -d * 0.4, w, 0.7 * h, d * 0.2), box(-w * 0.45, 0.4 * h, 0, w * 0.1, 0.5 * h, d), box(w * 0.45, 0.4 * h, 0, w * 0.1, 0.5 * h, d)]
  },
  mesaCentro: {
    nome: 'Mesa de centro', grupo: 'Sala', w: 1, d: 0.6, h: 0.4, cor: '#6b4f3a',
    partes: (w, d, h) => [box(0, h - 0.025, 0, w, 0.05, d), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box(a * (w / 2 - 0.05), (h - 0.05) / 2, b * (d / 2 - 0.05), 0.05, h - 0.05, 0.05, 'dark'))]
  },
  rackTv: {
    nome: 'Rack de TV', grupo: 'Sala', w: 1.5, d: 0.4, h: 0.5, cor: '#4a4a48',
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d), box(0, h * 0.5, d / 2 + 0.002, w * 0.96, h * 0.04, 0.004, 'dark')]
  },
  tv: {
    nome: 'TV', grupo: 'Sala', w: 1.2, d: 0.08, h: 0.7, cor: '#111111', elev: 0.55,
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d), box(0, h / 2, d / 2 + 0.002, w * 0.96, h * 0.92, 0.004, '#202830')]
  },
  estante: {
    nome: 'Estante', grupo: 'Sala', w: 0.9, d: 0.35, h: 1.8, cor: '#7a5c3e',
    partes: (w, d, h) => [box(-w / 2 + 0.01, h / 2, 0, 0.02, h, d), box(w / 2 - 0.01, h / 2, 0, 0.02, h, d), box(0, h / 2, -d / 2 + 0.005, w, h, 0.01, 'dark'), ...[0, 0.25, 0.5, 0.75, 1].map((f) => box(0, 0.01 + f * (h - 0.02), 0, w, 0.02, d))]
  },
  mesaJantar: {
    nome: 'Mesa de jantar', grupo: 'Sala', w: 1.6, d: 0.9, h: 0.75, cor: '#8c6a47',
    partes: (w, d, h) => [box(0, h - 0.02, 0, w, 0.04, d), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box(a * (w / 2 - 0.06), (h - 0.04) / 2, b * (d / 2 - 0.06), 0.06, h - 0.04, 0.06, 'dark'))]
  },
  cadeira: {
    nome: 'Cadeira', grupo: 'Sala', w: 0.45, d: 0.45, h: 0.9, cor: '#5c4a3a',
    partes: (w, d, h) => [box(0, 0.45 * h, 0, w, 0.04, d), box(0, 0.75 * h, -d / 2 + 0.02, w, 0.45 * h, 0.04), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box(a * (w / 2 - 0.025), 0.225 * h, b * (d / 2 - 0.025), 0.04, 0.45 * h, 0.04, 'dark'))]
  },
  camaCasal: {
    nome: 'Cama de casal', grupo: 'Quarto', w: 1.6, d: 2.05, h: 1.0, cor: '#d8d2c8',
    partes: (w, d, h) => [box(0, 0.15, 0, w, 0.3, d, 'dark'), box(0, 0.38, 0.02, w - 0.06, 0.16, d - 0.1, 'light'), box(0, 0.6, -d / 2 + 0.03, w, 0.7, 0.06, 'dark'), box(-w * 0.22, 0.5, -d / 2 + 0.3, w * 0.4, 0.1, 0.35), box(w * 0.22, 0.5, -d / 2 + 0.3, w * 0.4, 0.1, 0.35)]
  },
  camaSolteiro: {
    nome: 'Cama de solteiro', grupo: 'Quarto', w: 0.9, d: 1.95, h: 0.85, cor: '#c9d3df',
    partes: (w, d, h) => [box(0, 0.15, 0, w, 0.3, d, 'dark'), box(0, 0.37, 0.02, w - 0.06, 0.14, d - 0.1, 'light'), box(0, 0.55, -d / 2 + 0.03, w, 0.5, 0.06, 'dark'), box(0, 0.47, -d / 2 + 0.28, w * 0.7, 0.1, 0.3)]
  },
  guardaRoupa: {
    nome: 'Guarda-roupa', grupo: 'Quarto', w: 1.8, d: 0.6, h: 2.2, cor: '#e0dcd4',
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d), ...[-1, 0, 1].map((i) => box((i * w) / 3, h / 2, d / 2 + 0.002, w / 3 - 0.01, h - 0.04, 0.004, 'dark')), ...[-1, 0, 1].map((i) => box((i * w) / 3 + w / 6 - 0.04, h / 2, d / 2 + 0.01, 0.012, 0.3, 0.02, '#999999'))]
  },
  criado: {
    nome: 'Criado-mudo', grupo: 'Quarto', w: 0.45, d: 0.4, h: 0.5, cor: '#7a5c3e',
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d), box(0, h * 0.7, d / 2 + 0.002, w * 0.9, h * 0.25, 0.004, 'dark'), box(0, h * 0.35, d / 2 + 0.002, w * 0.9, h * 0.25, 0.004, 'dark')]
  },
  escrivaninha: {
    nome: 'Escrivaninha', grupo: 'Escritório', w: 1.2, d: 0.6, h: 0.75, cor: '#a68a64',
    partes: (w, d, h) => [box(0, h - 0.02, 0, w, 0.04, d), box(-w / 2 + 0.02, (h - 0.04) / 2, 0, 0.04, h - 0.04, d - 0.04, 'dark'), box(w / 2 - 0.02, (h - 0.04) / 2, 0, 0.04, h - 0.04, d - 0.04, 'dark')]
  },
  geladeira: {
    nome: 'Geladeira', grupo: 'Cozinha', w: 0.7, d: 0.7, h: 1.8, cor: '#c9ccd0',
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d), box(0, h * 0.68, d / 2 + 0.002, w * 0.98, 0.01, 0.004, '#555555'), box(w / 2 - 0.06, h * 0.82, d / 2 + 0.02, 0.02, 0.35, 0.03, '#888888')]
  },
  fogao: {
    nome: 'Fogão', grupo: 'Cozinha', w: 0.6, d: 0.6, h: 0.9, cor: '#d8dadc',
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d), box(0, h * 0.45, d / 2 + 0.002, w * 0.8, h * 0.4, 0.004, '#222222'), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => cyl(a * w * 0.22, h + 0.005, b * d * 0.22, 0.07, 0.01, '#222222'))]
  },
  balcao: {
    nome: 'Balcão de pia', grupo: 'Cozinha', w: 1.2, d: 0.6, h: 0.9, cor: '#e6e1d8',
    partes: (w, d, h) => [box(0, (h - 0.03) / 2, 0, w, h - 0.03, d), box(0, h - 0.015, 0, w + 0.02, 0.03, d + 0.02, '#555555'), box(-w * 0.2, h + 0.0, 0, w * 0.3, 0.01, d * 0.6, '#aab0b5')]
  },
  vaso: {
    nome: 'Vaso com planta', grupo: 'Decoração', modo: 'ambos', w: 0.4, d: 0.4, h: 1, cor: '#3f7a4a',
    partes: (w, d, h) => [cyl(0, 0.15, 0, w * 0.35, 0.3, '#a0522d'), cyl(0, 0.3 + (h - 0.3) / 2, 0, w * 0.08, h - 0.3, '#5a7a3a'), cyl(0, h - 0.2, 0, w * 0.45, 0.35, 'main')]
  },
  tapete: {
    nome: 'Tapete', grupo: 'Decoração', modo: 'ambos', w: 2, d: 1.4, h: 0.02, cor: '#9a8aa0', fantasma: true,
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d), box(0, h + 0.0005, 0, w * 0.9, 0.001, d * 0.9, 'light')]
  },
  porta: {
    nome: 'Porta', grupo: 'Aberturas', modo: 'ambos', w: 0.9, d: 0.1, h: 2.1, cor: '#b99872', fantasma: true,
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d), box(w / 2 - 0.08, h * 0.48, d / 2 + 0.02, 0.1, 0.03, 0.04, '#999999')]
  },
  janela: {
    nome: 'Janela', grupo: 'Aberturas', modo: 'ambos', w: 1.2, d: 0.1, h: 1.2, cor: '#9ec9e6', fantasma: true, elev: 0.9,
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d * 0.3, '#9ec9e6'), box(0, 0.02, 0, w, 0.04, d, 'dark'), box(0, h - 0.02, 0, w, 0.04, d, 'dark'), box(-w / 2 + 0.02, h / 2, 0, 0.04, h, d, 'dark'), box(w / 2 - 0.02, h / 2, 0, 0.04, h, d, 'dark'), box(0, h / 2, 0, 0.03, h, d, 'dark')]
  },

  // ---------- ambientes externos ----------
  // pisos e solos (zonas): peças baixas sobre o terreno, sem colisão
  gramado: { nome: 'Gramado', grupo: 'Pisos e solo', modo: 'externo', zona: true, fantasma: true, w: 4, d: 4, h: 0.05, cor: '#5f9e3f', tex: 'grama', tile: 2, partes: (w, d, h) => [box(0, h / 2, 0, w, h, d, 'main', 'grama', 2)] },
  terraSolo: { nome: 'Terra', grupo: 'Pisos e solo', modo: 'externo', zona: true, fantasma: true, w: 3, d: 3, h: 0.04, cor: '#7a5a3c', partes: (w, d, h) => [box(0, h / 2, 0, w, h, d, 'main', 'ruido', 1.5)] },
  areia: { nome: 'Areia', grupo: 'Pisos e solo', modo: 'externo', zona: true, fantasma: true, w: 3, d: 3, h: 0.05, cor: '#dccb9b', partes: (w, d, h) => [box(0, h / 2, 0, w, h, d, 'main', 'ruido', 1.5)] },
  calcada: { nome: 'Calçada de pedra', grupo: 'Pisos e solo', modo: 'externo', zona: true, fantasma: true, w: 1.5, d: 6, h: 0.06, cor: '#c2bdb2', partes: (w, d, h) => [box(0, h / 2, 0, w, h, d, 'main', 'pedra', 1.2)] },
  concreto: { nome: 'Concreto', grupo: 'Pisos e solo', modo: 'externo', zona: true, fantasma: true, w: 5, d: 5, h: 0.08, cor: '#b0aea8', partes: (w, d, h) => [box(0, h / 2, 0, w, h, d, 'main', 'ruido', 1.2)] },
  deck: { nome: 'Deck de madeira', grupo: 'Pisos e solo', modo: 'externo', zona: true, fantasma: true, w: 4, d: 3, h: 0.12, cor: '#a06c3f', partes: (w, d, h) => [box(0, h / 2, 0, w, h, d, 'main', 'tabua', 1)] },
  ceramica: { nome: 'Piso cerâmico', grupo: 'Pisos e solo', modo: 'ambos', zona: true, fantasma: true, w: 3, d: 3, h: 0.03, cor: '#cdbfae', partes: (w, d, h) => [box(0, h / 2, 0, w, h, d, 'main', 'ceramica', 1.2)] },
  asfalto: { nome: 'Rua (asfalto)', grupo: 'Pisos e solo', modo: 'externo', zona: true, fantasma: true, w: 8, d: 5, h: 0.05, cor: '#3d3d40', partes: (w, d, h) => [box(0, h / 2, 0, w, h, d, 'main', 'ruido', 1.5)] },
  piscina: {
    nome: 'Piscina', grupo: 'Pisos e solo', modo: 'externo', zona: true, fantasma: true, w: 6, d: 3, h: 0.15, cor: '#3aa6d8',
    partes: (w, d, h) => [
      box(0, h / 2, -d / 2 + 0.15, w, h, 0.3, '#e9e4d8'),
      box(0, h / 2, d / 2 - 0.15, w, h, 0.3, '#e9e4d8'),
      box(-w / 2 + 0.15, h / 2, 0, 0.3, h, d - 0.6, '#e9e4d8'),
      box(w / 2 - 0.15, h / 2, 0, 0.3, h, d - 0.6, '#e9e4d8'),
      box(0, h * 0.4, 0, w - 0.6, h * 0.8, d - 0.6, 'main', 'agua', 1.5)
    ]
  },

  // vegetação
  arvore: {
    nome: 'Árvore', grupo: 'Vegetação', modo: 'externo', w: 3, d: 3, h: 6, cor: '#3f8f3f',
    partes: (w, d, h) => [cyl(0, h * 0.25, 0, Math.min(w, d) * 0.04 + 0.05, h * 0.5, '#6b4a2b'), esf(0, h * 0.68, 0, w, h * 0.55, d, 'main', 'folhagem'), esf(w * 0.14, h * 0.82, w * 0.05, w * 0.6, h * 0.36, d * 0.6, 'light', 'folhagem')]
  },
  palmeira: {
    nome: 'Palmeira', grupo: 'Vegetação', modo: 'externo', w: 2, d: 2, h: 5, cor: '#4f9a3a',
    partes: (w, d, h) => [cyl(0, h * 0.4, 0, 0.1, h * 0.8, '#8a6b4a'), esf(0, h * 0.86, 0, w, h * 0.1, d, 'main', 'folhagem'), esf(0, h * 0.94, 0, w * 0.6, h * 0.1, d * 0.6, 'light', 'folhagem'), esf(0.12, h * 0.8, 0.1, 0.22, 0.22, 0.22, '#7a5a2b')]
  },
  arbusto: {
    nome: 'Arbusto', grupo: 'Vegetação', modo: 'externo', w: 1, d: 1, h: 0.9, cor: '#4a8f3a',
    partes: (w, d, h) => [esf(0, h * 0.45, 0, w, h * 0.9, d, 'main', 'folhagem'), esf(w * 0.18, h * 0.62, d * 0.1, w * 0.55, h * 0.7, d * 0.55, 'light', 'folhagem')]
  },
  cercaViva: { nome: 'Cerca viva', grupo: 'Vegetação', modo: 'externo', w: 3, d: 0.6, h: 1.4, cor: '#3f7f35', partes: (w, d, h) => [box(0, h / 2, 0, w, h, d, 'main', 'folhagem', 0.8)] },
  canteiro: {
    nome: 'Canteiro de flores', grupo: 'Vegetação', modo: 'externo', w: 2, d: 0.8, h: 0.35, cor: '#5b4330',
    partes: (w, d, h) => {
      const cores = ['#e85d75', '#f2c14e', '#f4f1ea', '#b46ad8']
      const flores = Array.from({ length: Math.round(w * d * 14) }, (_, i) => esf(((i * 0.618) % 1 - 0.5) * (w - 0.18), 0.2 + 0.07 + (i % 3) * 0.04, ((i * 0.382 + 0.3) % 1 - 0.5) * (d - 0.18), 0.11, 0.11, 0.11, cores[i % 4]))
      return [box(0, 0.1, 0, w, 0.2, d, 'main', 'ruido', 1), esf(0, 0.22, 0, w * 0.96, 0.1, d * 0.9, '#4d8a3a', 'folhagem'), ...flores]
    }
  },

  // construções e fachadas
  casa: {
    nome: 'Casa (fachada)', grupo: 'Construção', modo: 'externo', w: 10, d: 8, h: 5, cor: '#e8dfd0', folga: 0.5,
    opcoes: [
      { k: 'telhado', nome: 'Telhado', valores: [['duas', 'Duas águas'], ['quatro', 'Quatro águas'], ['plano', 'Laje plana']], padrao: 'duas' },
      { k: 'andares', nome: 'Pavimentos', valores: [['1', 'Térreo'], ['2', 'Sobrado']], padrao: '1' }
    ],
    partes: (w, d, h, op = {}) => {
      const tel = op.telhado ?? 'duas'
      const n = Number(op.andares ?? 1)
      const hp = tel === 'plano' ? h - 0.15 : h * 0.72
      const o = 0.3
      const pe = hp / n
      const partes = [box(0, hp / 2, 0, w, hp, d, 'main')]
      if (tel === 'plano') partes.push(box(0, h - 0.075, 0, w + 0.3, 0.15, d + 0.3, 'light'))
      else if (tel === 'duas') partes.push(prisma(0, hp + (h - hp) / 2, 0, w + 2 * o, h - hp, d + 2 * o, '#9b4a33', w >= d ? 'x' : 'z'))
      else partes.push(pir(0, hp + (h - hp) / 2, 0, w + 2 * o, h - hp, d + 2 * o, '#9b4a33'))
      // porta e janelas na fachada frontal (+z) e janelas nas laterais e no fundo
      partes.push(box(w * 0.2, 1.1, d / 2 + 0.01, 1.0, 2.2, 0.04, '#5a3a22'), box(w * 0.2 + 0.4, 1.05, d / 2 + 0.04, 0.06, 0.06, 0.04, '#d8b04a'))
      for (let a = 0; a < n; a++) {
        const y = a * pe + Math.min(1.6, pe * 0.55)
        const jan = (x, z, rot) => (rot ? [box(x, y, z, 0.04, 1.2, 1.5, '#eef1f3'), box(x + (x > 0 ? 0.03 : -0.03), y, z, 0.02, 1.08, 1.38, '#7fb7d9')] : [box(x, y, z, 1.6, 1.2, 0.04, '#eef1f3'), box(x, y, z + (z > 0 ? 0.03 : -0.03), 1.48, 1.08, 0.02, '#7fb7d9')])
        if (a > 0) partes.push(...jan(w * 0.2, d / 2 + 0.01, false))
        partes.push(...jan(-w * 0.25, d / 2 + 0.01, false), ...jan(-w / 2 - 0.01, 0, true), ...jan(w / 2 + 0.01, 0, true), ...jan(0, -d / 2 - 0.01, false))
      }
      if (n > 1) partes.push(box(0, pe, 0, w + 0.06, 0.12, d + 0.06, 'light'))
      return partes
    }
  },
  muro: { nome: 'Muro', grupo: 'Construção', modo: 'externo', w: 5, d: 0.2, h: 1.8, cor: '#d9cbb5', folga: 0.05, partes: (w, d, h) => [box(0, (h - 0.08) / 2, 0, w, h - 0.08, d, 'main', 'tijolo', 1), box(0, h - 0.04, 0, w + 0.04, 0.08, d + 0.06, 'light')] },
  cerca: {
    nome: 'Cerca de madeira', grupo: 'Construção', modo: 'externo', w: 4, d: 0.1, h: 1.2, cor: '#a8794a',
    partes: (w, d, h) => {
      const n = Math.max(2, Math.ceil(w / 1.5) + 1)
      const postes = Array.from({ length: n }, (_, i) => box(-w / 2 + 0.04 + (i * (w - 0.08)) / (n - 1), h / 2, 0, 0.08, h, d, 'dark'))
      return [...postes, box(0, h * 0.8, 0, w, 0.08, d * 0.6, 'main'), box(0, h * 0.4, 0, w, 0.08, d * 0.6, 'main')]
    }
  },
  portao: {
    nome: 'Portão', grupo: 'Construção', modo: 'externo', w: 3, d: 0.15, h: 1.7, cor: '#3b3f45',
    partes: (w, d, h) => {
      const n = Math.max(3, Math.floor(w / 0.14))
      return [box(-w / 2 + 0.05, h / 2, 0, 0.1, h, d, 'dark'), box(w / 2 - 0.05, h / 2, 0, 0.1, h, d, 'dark'), box(0, h - 0.04, 0, w, 0.08, d, 'main'), box(0, 0.12, 0, w, 0.08, d, 'main'), ...Array.from({ length: n }, (_, i) => box(-w / 2 + 0.15 + (i * (w - 0.3)) / (n - 1), h / 2, 0, 0.03, h - 0.2, 0.03, 'main'))]
    }
  },
  garagem: {
    nome: 'Garagem coberta', grupo: 'Construção', modo: 'externo', w: 5.5, d: 3, h: 2.6, cor: '#8a8f96', folga: 0.4,
    partes: (w, d, h) => [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box(a * (w / 2 - 0.1), (h - 0.15) / 2, b * (d / 2 - 0.1), 0.18, h - 0.15, 0.18, 'dark')), box(0, h - 0.075, 0, w + 0.4, 0.15, d + 0.4, 'main')]
  },
  pergolado: {
    nome: 'Pergolado', grupo: 'Construção', modo: 'externo', w: 4, d: 3, h: 2.5, cor: '#9a6a3d', folga: 0.2,
    partes: (w, d, h) => {
      const n = Math.max(4, Math.floor(d / 0.4))
      return [
        ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box(a * (w / 2 - 0.08), (h - 0.2) / 2, b * (d / 2 - 0.08), 0.15, h - 0.2, 0.15, 'dark')),
        ...[-1, 1].map((a) => box(a * (w / 2 - 0.08), h - 0.1, 0, 0.12, 0.2, d, 'main')),
        ...Array.from({ length: n }, (_, i) => box(0, h - 0.04, -d / 2 + 0.1 + (i * (d - 0.2)) / (n - 1), w + 0.2, 0.08, 0.08, 'main'))
      ]
    }
  },
  escada: { nome: 'Escada externa', grupo: 'Construção', modo: 'externo', w: 1.4, d: 1.2, h: 0.6, cor: '#bdb8ae', partes: (w, d, h) => [1, 2, 3, 4].map((i) => box(0, (h * i) / 8, d / 2 - ((i - 0.5) * d) / 4, w, (h * i) / 4, d / 4, 'main', 'ruido', 1)) },

  // área externa
  banco: { nome: 'Banco de jardim', grupo: 'Área externa', modo: 'externo', w: 1.5, d: 0.5, h: 0.8, cor: '#9a6a3d', partes: (w, d, h) => [box(0, 0.45, 0.02, w, 0.06, d - 0.05, 'main'), box(0, 0.62, -d / 2 + 0.04, w, 0.35, 0.05, 'main'), box(-w / 2 + 0.1, 0.22, 0, 0.08, 0.44, d, 'dark'), box(w / 2 - 0.1, 0.22, 0, 0.08, 0.44, d, 'dark')] },
  mesaExterna: {
    nome: 'Mesa com cadeiras', grupo: 'Área externa', modo: 'externo', w: 2.2, d: 2.2, h: 0.8, cor: '#d9d4c8',
    partes: (w, d, h) => [cyl(0, h - 0.02, 0, Math.min(w, d) * 0.27, 0.04, 'main'), cyl(0, (h - 0.04) / 2, 0, 0.05, h - 0.04, 'dark'), ...[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => box(a * (w / 2 - 0.25), 0.45, b * (d / 2 - 0.25), 0.45, 0.06, 0.45, 'dark'))]
  },
  churrasqueira: {
    nome: 'Churrasqueira', grupo: 'Área externa', modo: 'externo', w: 1.1, d: 0.7, h: 2, cor: '#b5593a',
    partes: (w, d, h) => [box(0, 0.45, 0, w, 0.9, d, 'main', 'tijolo', 1), box(0, 0.93, 0, w + 0.04, 0.06, d + 0.04, 'light'), box(0, 1.45, -d / 2 + 0.2, w * 0.55, 1.1, 0.4, 'main', 'tijolo', 1), box(0, 1.0, 0.05, w * 0.8, 0.02, d * 0.6, '#333333')]
  },
  guardaSol: { nome: 'Ombrelone', grupo: 'Área externa', modo: 'externo', w: 2.4, d: 2.4, h: 2.4, cor: '#e8c24a', partes: (w, d, h) => [cyl(0, 0.05, 0, 0.25, 0.1, 'dark'), cyl(0, h / 2, 0, 0.03, h, '#8a8a8a'), cone(0, h - 0.27, 0, Math.min(w, d) / 2, 0.55, 'main')] },
  espreguicadeira: { nome: 'Espreguiçadeira', grupo: 'Área externa', modo: 'externo', w: 0.7, d: 1.9, h: 0.65, cor: '#f1efe8', partes: (w, d, h) => [box(0, 0.3, 0.2, w, 0.08, d * 0.62, 'main'), box(0, 0.48, -d / 2 + 0.28, w, 0.08, 0.55, 'main'), box(0, 0.58, -d / 2 + 0.08, w, 0.1, 0.12, 'main'), ...[-1, 1].map((a) => box(a * (w / 2 - 0.04), 0.15, 0.2, 0.05, 0.3, d * 0.6, 'dark'))] },
  poste: { nome: 'Poste de luz', grupo: 'Área externa', modo: 'externo', w: 0.4, d: 0.4, h: 4.5, cor: '#4a4f57', partes: (w, d, h) => [cyl(0, h / 2, 0, 0.05, h, 'main'), cyl(0, 0.1, 0, 0.14, 0.2, 'main'), esf(0, h - 0.12, 0, 0.3, 0.26, 0.3, '#fff3b0')] },
  carro: {
    nome: 'Carro', grupo: 'Área externa', modo: 'externo', w: 1.8, d: 4.4, h: 1.5, cor: '#b3262d',
    partes: (w, d, h) => [box(0, 0.62, 0, w, 0.5, d, 'main'), box(0, 1.1, -0.1, w * 0.88, 0.46, d * 0.52, '#8fb4cf'), box(0, 1.34, -0.1, w * 0.84, 0.05, d * 0.46, 'main'), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => cyl(a * (w / 2 - 0.1), 0.32, b * (d * 0.32), 0.32, 0.22, '#1b1b1d', 'x'))]
  }
}

export const GRUPOS = [...new Set(Object.values(CATALOGO).map((c) => c.grupo))]
const ORDEM = ['Pisos e solo', 'Vegetação', 'Construção', 'Área externa', 'Sala', 'Quarto', 'Escritório', 'Cozinha', 'Decoração', 'Aberturas']
export const gruposDe = (modo) => [...new Set(Object.values(CATALOGO).filter((c) => (c.modo ?? 'interno') === modo || c.modo === 'ambos').map((c) => c.grupo))].sort((a, b) => ORDEM.indexOf(a) - ORDEM.indexOf(b))
export const itensDe = (modo, grupo) => Object.entries(CATALOGO).filter(([, c]) => c.grupo === grupo && ((c.modo ?? 'interno') === modo || c.modo === 'ambos'))
export const opcoesPadrao = (tipo) => Object.fromEntries((CATALOGO[tipo]?.opcoes ?? []).map((o) => [o.k, o.padrao]))

// materiais do solo do terreno (ambiente externo)
export const SOLOS = {
  grama: { nome: 'Grama', cor: '#5f9e3f', tex: 'grama', tile: 2 },
  terra: { nome: 'Terra', cor: '#7a5a3c', tex: 'ruido', tile: 1.5 },
  areia: { nome: 'Areia', cor: '#dccb9b', tex: 'ruido', tile: 1.5 },
  concreto: { nome: 'Concreto', cor: '#b0aea8', tex: 'ruido', tile: 1.2 },
  pedra: { nome: 'Pedra', cor: '#c2bdb2', tex: 'pedra', tile: 1.2 },
  deck: { nome: 'Deck', cor: '#a06c3f', tex: 'tabua', tile: 1 }
}
