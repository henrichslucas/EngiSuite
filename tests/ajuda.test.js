import { describe, expect, it } from 'vitest'
import { contexto, dica, sugestoes } from '../src/lib/ajuda.js'

describe('ajuda de fórmulas', () => {
  it('token de função sob o caret', () => {
    expect(contexto('=SO', 3).token).toEqual({ inicio: 1, fim: 3, texto: 'SO' })
    expect(contexto('=A1+MÉD', 7).token.texto).toBe('MÉD')
    expect(contexto('=SOMA(A1)', 9).token).toBeNull() // fora de nome
    expect(contexto('=A1', 3).token).toBeNull() // referência de célula nunca é “nome”? (A1 começa por letra)
  })
  it('não sugere em texto nem fora de fórmulas', () => {
    expect(contexto('SO', 2).token).toBeNull()
    expect(contexto('="so', 4).token).toBeNull()
  })
  it('função aberta e argumento atual', () => {
    expect(contexto('=SE(A1>1;SOMA(B1;', 17).funcao).toEqual({ nome: 'SOMA', arg: 1 })
    expect(contexto('=SE(A1>1;SOMA(B1;C1);', 21).funcao).toEqual({ nome: 'SE', arg: 2 })
    expect(contexto('=SE(A1;"a;b";', 13).funcao).toEqual({ nome: 'SE', arg: 2 })
    expect(contexto('=1+2', 4).funcao).toBeNull()
  })
  it('sugestões por prefixo, com ou sem acento', () => {
    const s = sugestoes('MED').map((x) => x.nome)
    expect(s).toContain('MED')
    expect(s).toContain('MÉDIA')
    expect(sugestoes('soma')[0].nome).toBe('SOMA')
    expect(sugestoes('SOMA').find((x) => x.nome === 'SOMASE').info.desc).toMatch(/critério/)
    expect(sugestoes('')).toEqual([])
  })
  it('dica de sintaxe destaca o argumento atual', () => {
    const d = dica({ nome: 'PROCV', arg: 2 })
    expect(d.nome).toBe('PROCV')
    expect(d.args[d.atual]).toBe('col_índice')
    const s = dica({ nome: 'SOMA', arg: 5 })
    expect(s.args[s.atual]).toContain('…')
    expect(dica({ nome: 'XPTO', arg: 0 })).toBeNull()
  })
})
