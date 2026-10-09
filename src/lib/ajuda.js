// Ajuda de digitação para fórmulas: sugestões de nomes de função e dica de sintaxe da função em edição.
import { CATALOGO, infoFuncao } from './catalogo.js'
import { NOMES_LOCAIS } from './formulas.js'

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
const LETRA = /[A-Za-zÀ-ÿ_]/
const PARTE = /[A-Za-zÀ-ÿ0-9_.]/

// posições dentro de strings não contam; devolve true se o caret está em texto entre aspas
function dentroDeTexto(texto, caret) {
  let aberto = false
  for (let i = 0; i < caret; i++) if (texto[i] === '"') aberto = !aberto
  return aberto
}

export function contexto(texto, caret) {
  if (typeof texto !== 'string' || texto[0] !== '=' || dentroDeTexto(texto, caret)) return { token: null, funcao: null }
  // token de função sob o caret
  let ini = caret
  while (ini > 1 && PARTE.test(texto[ini - 1])) ini--
  let fim = caret
  while (fim < texto.length && PARTE.test(texto[fim])) fim++
  const tk = texto.slice(ini, fim)
  const antes = texto[ini - 1]
  const ehRef = /^\$?[A-Za-z]{1,3}\$?\d+$/.test(tk)
  const token = tk && !ehRef && LETRA.test(tk[0]) && !/[0-9A-Za-zÀ-ÿ_$!'.]/.test(antes ?? '') && texto[fim] !== '(' ? { inicio: ini, fim, texto: tk } : null

  // função aberta mais interna e índice do argumento
  const pilha = []
  let i = 1
  while (i < caret) {
    const c = texto[i]
    if (c === '"') {
      i++
      while (i < caret && texto[i] !== '"') i++
      i++
      continue
    }
    if (c === '(') {
      let j = i
      while (j > 1 && PARTE.test(texto[j - 1])) j--
      pilha.push({ nome: texto.slice(j, i).toUpperCase(), arg: 0 })
    } else if (c === ')') pilha.pop()
    else if ((c === ';' || c === ',') && pilha.length) pilha[pilha.length - 1].arg++
    i++
  }
  const topo = [...pilha].reverse().find((p) => p.nome)
  return { token, funcao: topo ?? null }
}

export function sugestoes(prefixo, max = 8) {
  const p = semAcento(prefixo)
  if (!p) return []
  const nomes = NOMES_LOCAIS.filter((n) => semAcento(n).startsWith(p))
  nomes.sort((a, b) => a.length - b.length || a.localeCompare(b, 'pt-BR'))
  return [...new Set(nomes)].slice(0, max).map((nome) => ({ nome, info: infoFuncao(nome) ?? null }))
}

// partes da sintaxe com o argumento atual em destaque
export function dica(funcao) {
  if (!funcao) return null
  const nome = [...NOMES_LOCAIS, ...CATALOGO.map((f) => f.nome)].find((n) => semAcento(n) === semAcento(funcao.nome))
  const info = nome && infoFuncao(nome)
  if (!info) return null
  const args = info.args ? info.args.split(';').map((a) => a.trim()) : []
  let atual = Math.min(funcao.arg, Math.max(args.length - 1, 0))
  // “…” no fim: o último argumento se repete
  if (args.at(-1)?.includes('…') && funcao.arg >= args.length - 1) atual = args.length - 1
  return { nome: info.nome, args, atual, desc: info.desc }
}
