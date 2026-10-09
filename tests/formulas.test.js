import { describe, expect, it } from 'vitest'
import { HyperFormula } from 'hyperformula'
import { BR, erroLocal, formulaDoXlsx, nomeCanonico, nomeLocal, paraCanonico, paraLocal } from '../src/lib/formulas.js'
import { CATALOGO } from '../src/lib/catalogo.js'
import { registrarExtras } from '../src/lib/custom.js'
import { converterUnidade } from '../src/lib/convert.js'

registrarExtras()
const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })
hf.addSheet('S')
const reg = new Set(HyperFormula.getRegisteredFunctionNames('enGB'))

describe('tradução de fórmulas', () => {
  it('canônico → pt-BR', () => {
    expect(paraLocal('=SUM(A1:A3)')).toBe('=SOMA(A1:A3)')
    expect(paraLocal('=IF(A1>1.5,SUM(B1,2.25),"a,b")')).toBe('=SE(A1>1,5;SOMA(B1;2,25);"a,b")')
    expect(paraLocal('=VLOOKUP(A1,Dados!A1:B9,2,FALSE())')).toBe('=PROCV(A1;Dados!A1:B9;2;FALSO)')
    expect(paraLocal("='Minha aba'!A1+LEN(B2)")).toBe("='Minha aba'!A1+NÚM.CARACT(B2)")
    expect(paraLocal('=A1*.5')).toBe('=A1*,5')
  })
  it('pt-BR → canônico', () => {
    expect(paraCanonico('=SOMA(A1:A3)')).toBe('=SUM(A1:A3)')
    expect(paraCanonico('=se(A1>1,5;soma(B1;2,25);"a;b")')).toBe('=IF(A1>1.5,SUM(B1,2.25),"a;b")')
    expect(paraCanonico('=PROCV(A1;Dados!A1:B9;2;FALSO)')).toBe('=VLOOKUP(A1,Dados!A1:B9,2,FALSE())')
    expect(paraCanonico('=SE(VERDADEIRO;1;0)')).toBe('=IF(TRUE(),1,0)')
    expect(formulaDoXlsx('=IF(A1=TRUE,"TRUE",FALSE)')).toBe('=IF(A1=TRUE(),"TRUE",FALSE())')
    expect(paraCanonico('=media(A1:A9)+MEDIA(B1:B9)')).toBe('=AVERAGE(A1:A9)+AVERAGE(B1:B9)')
    expect(paraCanonico('=A1*,5')).toBe('=A1*.5')
    expect(paraCanonico('=1,5E-3*A1')).toBe('=1.5E-3*A1')
  })
  it('aceita nomes em inglês e funções desconhecidas', () => {
    expect(paraCanonico('=SUM(A1;B1)')).toBe('=SUM(A1,B1)')
    expect(paraCanonico('=SUM(A1,B1)')).toBe('=SUM(A1,B1)')
    expect(paraCanonico('=XPTO(1)')).toBe('=XPTO(1)')
    expect(paraLocal('=XPTO(1)')).toBe('=XPTO(1)')
  })
  it('referências com dígitos não viram números', () => {
    expect(paraCanonico('=A1,5')).toBe('=A1,5')
    expect(paraLocal('=B2+$C$3*2.5')).toBe('=B2+$C$3*2,5')
  })
  it('ida e volta preserva a fórmula', () => {
    for (const f of ['=SUM(A1:A9)/COUNT(A1:A9)', '=IFERROR(VLOOKUP(A2,B:C,2,FALSE()),"n/d")', '=ROUND(A1*1.05,2)', '=TEXT(A1,"0.00")&" m"', '=SUMIFS(C:C,A:A,">=10",B:B,"x")']) {
      expect(paraCanonico(paraLocal(f))).toBe(f)
    }
  })
  it('não mexe em texto que não é fórmula nem em arrays', () => {
    expect(paraLocal('texto, simples')).toBe('texto, simples')
    expect(paraCanonico('=SUM({1,2;3,4})')).toBe('=SUM({1,2;3,4})')
  })
  it('nomes sem acento são aceitos', () => {
    expect(nomeCanonico('MEDIA')).toBe('AVERAGE')
    expect(nomeCanonico('Índice')).toBe('INDEX')
    expect(nomeLocal('SUM')).toBe('SOMA')
  })
  it('erros em português', () => {
    expect(erroLocal('#NAME?')).toBe('#NOME?')
    expect(erroLocal('#DIV/0!')).toBe('#DIV/0!')
  })
})

describe('tabela de nomes', () => {
  it('toda função mapeada existe no motor', () => {
    const faltando = Object.keys(BR).filter((k) => !reg.has(k))
    expect(faltando).toEqual([])
  })
  it('nomes pt-BR são únicos (ignorando acentos)', () => {
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    const vistos = new Map()
    for (const [k, v] of Object.entries(BR)) {
      expect(vistos.has(norm(v)), `${v} repetido (${k} e ${vistos.get(norm(v))})`).toBe(false)
      vistos.set(norm(v), k)
    }
  })
  it('catálogo só traz funções existentes e sem duplicatas', () => {
    expect(CATALOGO.filter((f) => !reg.has(f.k)).map((f) => f.k)).toEqual([])
    expect(new Set(CATALOGO.map((f) => f.k)).size).toBe(CATALOGO.length)
  })
})

describe('motor avalia as fórmulas do catálogo (exemplos)', () => {
  const ev = (f) => {
    hf.setSheetContent(0, [[1, 2, 3, 4], [10, 20, 30, 40], [f]])
    return hf.getCellValue({ sheet: 0, row: 2, col: 0 })
  }
  it('cálculos básicos após tradução', () => {
    const t = (loc) => ev(paraCanonico(loc))
    expect(t('=SOMA(A1:D1)')).toBe(10)
    expect(t('=SE(A1<2;"menor";"maior")')).toBe('menor')
    expect(t('=PROCV(10;A1:B2;2;FALSO)')).toBe(20)
    expect(t('=ARRED(2,345;2)')).toBeCloseTo(2.35, 9)
    expect(t('=SOMASE(A1:D1;">2";A2:D2)')).toBe(70)
    expect(t('=SOMARPRODUTO(A1:D1;A2:D2)')).toBe(300)
    expect(t('=MÉDIA(A2:D2)')).toBe(25)
    expect(t('=CONT.SE(A1:D1;">1")')).toBe(3)
    expect(t('=SEERRO(1/0;"erro")')).toBe('erro')
    expect(t('=ESQUERDA("engenharia";3)')).toBe('eng')
    expect(t('=MÁXIMO(A2:D2)-MÍNIMO(A2:D2)')).toBe(30)
    expect(t('=RAIZ(16)+POTÊNCIA(2;3)')).toBe(12)
  })
})

describe('funções extras', () => {
  const ev = (f, dados = [[1, 2, 2, 5], [10, 20, 30, 40]]) => {
    hf.setSheetContent(0, [...dados, [paraCanonico(f)]])
    return hf.getCellValue({ sheet: 0, row: dados.length, col: 0 })
  }
  it('CONVERTER', () => {
    expect(ev('=CONVERTER(1;"ft";"m")')).toBeCloseTo(0.3048, 9)
    expect(ev('=CONVERTER(1;"tf";"kN")')).toBeCloseTo(9.80665, 9)
    expect(ev('=CONVERTER(100;"C";"F")')).toBeCloseTo(212, 9)
    expect(ev('=CONVERTER(1;"m";"kg")').value).toBe('#N/A')
  })
  it('CONCAT, ORDEM, MODO, INTERCEPÇÃO', () => {
    expect(ev('=CONCAT("a";"b";A1)')).toBe('ab1')
    expect(ev('=CONCAT(A1:D1)')).toBe('1225')
    expect(ev('=ORDEM(30;A2:D2)')).toBe(2)
    expect(ev('=ORDEM(30;A2:D2;1)')).toBe(3)
    expect(ev('=MODO(A1:D1)')).toBe(2)
    expect(ev('=INTERCEPÇÃO(A2:D2;A1:D1)')).toBeCloseTo(0.4 * 0 + (() => { const x=[1,2,2,5],y=[10,20,30,40];const mx=2.5,my=25;const sxy=x.reduce((a,b,i)=>a+(b-mx)*(y[i]-my),0),sxx=x.reduce((a,b)=>a+(b-mx)**2,0);return my-sxy/sxx*mx })(), 9)
  })
  it('conversor puro', () => {
    expect(converterUnidade(1, 'km', 'm')).toBe(1000)
    expect(converterUnidade(1, 'MPa', 'kPa')).toBe(1000)
    expect(converterUnidade(1, 'atm', 'psi')).toBeCloseTo(14.6959, 3)
    expect(Number.isNaN(converterUnidade(1, 'xx', 'm'))).toBe(true)
  })
})
