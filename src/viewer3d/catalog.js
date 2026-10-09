// Catálogo de móveis paramétricos. Dimensões em metros. Cada móvel gera "partes" (caixas e cilindros)
// com origem no centro da base: x (largura), y (altura), z (profundidade).
// cor: 'main' (cor escolhida), 'dark', 'light' ou um hex.

const box = (x, y, z, sx, sy, sz, cor = 'main') => ({ t: 'box', x, y, z, sx, sy, sz, cor })
const cyl = (x, y, z, r, sy, cor = 'main') => ({ t: 'cyl', x, y, z, r, sy, cor })

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
    nome: 'Vaso com planta', grupo: 'Decoração', w: 0.4, d: 0.4, h: 1, cor: '#3f7a4a',
    partes: (w, d, h) => [cyl(0, 0.15, 0, w * 0.35, 0.3, '#a0522d'), cyl(0, 0.3 + (h - 0.3) / 2, 0, w * 0.08, h - 0.3, '#5a7a3a'), cyl(0, h - 0.2, 0, w * 0.45, 0.35, 'main')]
  },
  tapete: {
    nome: 'Tapete', grupo: 'Decoração', w: 2, d: 1.4, h: 0.02, cor: '#9a8aa0', fantasma: true,
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d), box(0, h + 0.0005, 0, w * 0.9, 0.001, d * 0.9, 'light')]
  },
  porta: {
    nome: 'Porta', grupo: 'Aberturas', w: 0.9, d: 0.1, h: 2.1, cor: '#b99872', fantasma: true,
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d), box(w / 2 - 0.08, h * 0.48, d / 2 + 0.02, 0.1, 0.03, 0.04, '#999999')]
  },
  janela: {
    nome: 'Janela', grupo: 'Aberturas', w: 1.2, d: 0.1, h: 1.2, cor: '#9ec9e6', fantasma: true, elev: 0.9,
    partes: (w, d, h) => [box(0, h / 2, 0, w, h, d * 0.3, '#9ec9e6'), box(0, 0.02, 0, w, 0.04, d, 'dark'), box(0, h - 0.02, 0, w, 0.04, d, 'dark'), box(-w / 2 + 0.02, h / 2, 0, 0.04, h, d, 'dark'), box(w / 2 - 0.02, h / 2, 0, 0.04, h, d, 'dark'), box(0, h / 2, 0, 0.03, h, d, 'dark')]
  }
}

export const GRUPOS = [...new Set(Object.values(CATALOGO).map((c) => c.grupo))]
