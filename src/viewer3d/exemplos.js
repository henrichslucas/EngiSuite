// Cenas iniciais usadas no primeiro acesso e no botão "Restaurar exemplo".
import { novoItem } from './layout.js'

export function salaPadrao(modo) {
  return modo === 'externo'
    ? { modo: 'externo', w: 20, d: 30, h: 3, cParede: '#e9e5de', cPiso: '#b8a58c', solo: 'grama' }
    : { modo: 'interno', w: 4.5, d: 3.5, h: 2.7, cParede: '#e9e5de', cPiso: '#b8a58c', solo: 'grama' }
}

const pos = (sala, tipo, x, z, extra = {}) => ({ ...novoItem(tipo, sala), x, z, ...extra })

export function exemploInterno(sala) {
  return [pos(sala, 'sofa', 2.2, 2.7, { rot: 180 }), pos(sala, 'mesaCentro', 2.2, 1.75), pos(sala, 'rackTv', 2.2, 0.3)]
}

export function exemploExterno(sala) {
  return [
    pos(sala, 'casa', 10, 10),
    pos(sala, 'calcada', 12, 18.2),
    pos(sala, 'concreto', 16.8, 19, { w: 4.8, d: 6.4 }),
    pos(sala, 'carro', 16.8, 19.5),
    pos(sala, 'piscina', 10, 3),
    pos(sala, 'espreguicadeira', 5.2, 3, { rot: 90 }),
    pos(sala, 'arvore', 3.5, 22),
    pos(sala, 'palmeira', 2.2, 12),
    pos(sala, 'canteiro', 7, 14.9, { w: 3, d: 0.8 }),
    pos(sala, 'arbusto', 4.2, 14.6),
    pos(sala, 'cercaViva', 3.2, 28.5, { w: 5 }),
    pos(sala, 'muro', 6, 29.9, { w: 12 }),
    pos(sala, 'portao', 13.6, 29.9),
    pos(sala, 'muro', 17.575, 29.9, { w: 4.85 })
  ]
}
