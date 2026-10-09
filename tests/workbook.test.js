import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/store.js', () => ({ load: async () => null, save: async () => {} }))

const { wb } = await import('../src/lib/workbook.svelte.js')
const { show } = await import('../src/lib/util.js')

beforeAll(async () => {
  await wb.init()
})

const put = (r, c, t) => wb.setCell(r, c, t)

describe('Workbook', () => {
  it('inicia com a planilha de exemplo', () => {
    expect(wb.ready).toBe(true)
    expect(wb.sheets.length).toBe(1)
  })

  it('calcula fórmulas e entende vírgula decimal', () => {
    wb.addSheet()
    put(0, 0, '1,5')
    put(1, 0, '2,5')
    put(2, 0, '=SUM(A1:A2)')
    expect(wb.cellValue(2, 0)).toBe(4)
    expect(wb.raw(0, 0)).toBe('1,5')
  })

  it('stats considera só números na seleção', () => {
    put(3, 0, 'texto')
    wb.select(0, 0, 3, 0)
    const s = wb.stats()
    expect(s.count).toBe(3)
    expect(s.sum).toBe(8)
    expect(s.min).toBe(1.5)
    expect(s.max).toBe(4)
  })

  it('desfaz e refaz', () => {
    put(5, 0, '10')
    expect(wb.cellValue(5, 0)).toBe(10)
    wb.undo()
    expect(wb.cellValue(5, 0)).toBeNull()
    wb.redo()
    expect(wb.cellValue(5, 0)).toBe(10)
  })

  it('cola texto tabulado', () => {
    wb.select(10, 0, 10, 0)
    wb.pasteText('1\t2\n3\t4')
    expect(wb.cellValue(11, 1)).toBe(4)
    expect(wb.label).toBe('A11:B12')
  })

  it('copia e cola ajustando referências', () => {
    put(20, 0, '5')
    put(20, 1, '=A21*2')
    wb.select(20, 1, 20, 1)
    wb.copySel(false)
    wb.select(21, 1, 21, 1)
    wb.pasteText(wb.clipText)
    expect(wb.raw(21, 1)).toBe('=A22*2')
  })

  it('gerencia nomes de abas', () => {
    const base = wb.sheets[0]
    expect(wb.uniqueName(base.name)).not.toBe(base.name)
    expect(wb.renameSheet(base.id, '')).toBe(false)
    const other = wb.sheets[1]
    expect(wb.renameSheet(other.id, base.name.toUpperCase())).toBe(false)
    expect(wb.renameSheet(other.id, 'Cargas')).toBe(true)
  })

  it('não remove a última aba', () => {
    while (wb.sheets.length > 1) wb.removeSheet(wb.sheets[0].id)
    wb.removeSheet(wb.sheets[0].id)
    expect(wb.sheets.length).toBe(1)
  })
})

describe('fórmulas em português', () => {
  it('aceita nomes e separadores do Excel pt-BR e mostra a fórmula no mesmo formato', () => {
    wb.addSheet()
    put(0, 0, '1,5')
    put(1, 0, '2,5')
    put(2, 0, '=SOMA(A1:A2)*2')
    expect(wb.cellValue(2, 0)).toBe(8)
    expect(wb.raw(2, 0)).toBe('=SOMA(A1:A2)*2')
    put(3, 0, '=SE(A3>5;"alto";"baixo")')
    expect(wb.cellValue(3, 0)).toBe('alto')
    expect(wb.raw(3, 0)).toBe('=SE(A3>5;"alto";"baixo")')
    put(4, 0, '=ARRED(A1/3;2)')
    expect(wb.cellValue(4, 0)).toBeCloseTo(0.5, 9)
    put(5, 0, '=CONVERTER(1;"tf";"kN")')
    expect(wb.cellValue(5, 0)).toBeCloseTo(9.80665, 9)
  })
  it('fórmulas em inglês também funcionam e erros aparecem em português', () => {
    put(6, 0, '=SUM(A1;A2)')
    expect(wb.cellValue(6, 0)).toBe(4)
    expect(wb.raw(6, 0)).toBe('=SOMA(A1;A2)')
    put(7, 0, '=1/0')
    expect(show(wb.cellValue(7, 0))).toBe('#DIV/0!')
    put(8, 0, '=XPTO(1)')
    expect(show(wb.cellValue(8, 0))).toBe('#NOME?')
  })
})
