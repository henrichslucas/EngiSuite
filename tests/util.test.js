import { describe, expect, it } from 'vitest'
import { addr, clamp, colName, parseInput, plain, show } from '../src/lib/util.js'

describe('colName / addr', () => {
  it('converte índices em letras', () => {
    expect(colName(0)).toBe('A')
    expect(colName(25)).toBe('Z')
    expect(colName(26)).toBe('AA')
    expect(colName(701)).toBe('ZZ')
    expect(colName(702)).toBe('AAA')
  })
  it('monta endereços', () => {
    expect(addr(0, 0)).toBe('A1')
    expect(addr(9, 27)).toBe('AB10')
  })
})

describe('parseInput', () => {
  it('converte decimal com vírgula', () => {
    expect(parseInput('3,14')).toBe('3.14')
    expect(parseInput(' -2,5 ')).toBe('-2.5')
  })
  it('preserva fórmulas, texto e vazio', () => {
    expect(parseInput('=SOMA(A1:A3)')).toBe('=SOMA(A1:A3)')
    expect(parseInput('abc')).toBe('abc')
    expect(parseInput('')).toBeNull()
    expect(parseInput(7)).toBe(7)
  })
})

describe('show / plain', () => {
  it('formata números em pt-BR', () => {
    expect(show(1234.5)).toBe('1.234,5')
    expect(plain(1.5)).toBe('1,5')
  })
  it('formata booleanos, erros e nulos', () => {
    expect(show(true)).toBe('VERDADEIRO')
    expect(show(false)).toBe('FALSO')
    expect(show(null)).toBe('')
    expect(show({ value: '#DIV/0!' })).toBe('#DIV/0!')
  })
})

it('clamp', () => {
  expect(clamp(5, 0, 3)).toBe(3)
  expect(clamp(-1, 0, 3)).toBe(0)
  expect(clamp(2, 0, 3)).toBe(2)
})
