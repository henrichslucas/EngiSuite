// Funções que o motor não traz de fábrica e que o Excel tem: CONVERT, CONCAT, RANK, MODE e INTERCEPT.
import { CellError, ErrorType, FunctionPlugin, HyperFormula } from 'hyperformula'
import { converterUnidade } from './convert.js'

const achatar = (m) => m.flat().filter((x) => typeof x === 'number')

class Extras extends FunctionPlugin {
  convert(ast, state) {
    return this.runFunction(ast.args, state, this.metadata('CONVERT'), (n, de, para) => {
      const r = converterUnidade(n, de, para)
      return Number.isNaN(r) ? new CellError(ErrorType.NA) : r
    })
  }

  concat(ast, state) {
    return this.runFunction(ast.args, state, this.metadata('CONCAT'), (...t) => t.join(''))
  }

  rank(ast, state) {
    return this.runFunction(ast.args, state, this.metadata('RANK'), (n, ref, ordem) => {
      const v = achatar(ref.rawData())
      if (!v.includes(n)) return new CellError(ErrorType.NA)
      return 1 + v.filter((x) => (ordem ? x < n : x > n)).length
    })
  }

  mode(ast, state) {
    return this.runFunction(ast.args, state, this.metadata('MODE'), (ref) => {
      const cont = new Map()
      for (const x of achatar(ref.rawData())) cont.set(x, (cont.get(x) ?? 0) + 1)
      let melhor = null
      let n = 1
      for (const [x, c] of cont) if (c > n) ((melhor = x), (n = c))
      return melhor ?? new CellError(ErrorType.NA)
    })
  }

  intercept(ast, state) {
    return this.runFunction(ast.args, state, this.metadata('INTERCEPT'), (ys, xs) => {
      const y = achatar(ys.rawData())
      const x = achatar(xs.rawData())
      if (y.length !== x.length || y.length < 2) return new CellError(ErrorType.NA)
      const mx = x.reduce((a, b) => a + b, 0) / x.length
      const my = y.reduce((a, b) => a + b, 0) / y.length
      const sxx = x.reduce((a, b) => a + (b - mx) ** 2, 0)
      if (sxx === 0) return new CellError(ErrorType.DIV_BY_ZERO)
      const sxy = x.reduce((a, b, i) => a + (b - mx) * (y[i] - my), 0)
      return my - (sxy / sxx) * mx
    })
  }
}

Extras.implementedFunctions = {
  CONVERT: { method: 'convert', parameters: [{ argumentType: 'NUMBER' }, { argumentType: 'STRING' }, { argumentType: 'STRING' }] },
  CONCAT: { method: 'concat', parameters: [{ argumentType: 'STRING' }], repeatLastArgs: 1, expandRanges: true },
  RANK: { method: 'rank', parameters: [{ argumentType: 'NUMBER' }, { argumentType: 'RANGE' }, { argumentType: 'NUMBER', optionalArg: true, defaultValue: 0 }] },
  MODE: { method: 'mode', parameters: [{ argumentType: 'RANGE' }] },
  INTERCEPT: { method: 'intercept', parameters: [{ argumentType: 'RANGE' }, { argumentType: 'RANGE' }] }
}

let registrado = false
export function registrarExtras() {
  if (registrado) return
  registrado = true
  HyperFormula.registerFunctionPlugin(Extras, { enGB: Object.fromEntries(Object.keys(Extras.implementedFunctions).map((k) => [k, k])) })
}
