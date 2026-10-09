// Tradução de fórmulas entre a forma canônica do motor (nomes em inglês, argumentos separados por vírgula,
// decimal com ponto: o mesmo formato do .xlsx) e a forma exibida ao usuário (Excel pt-BR: nomes em português,
// argumentos separados por ponto e vírgula, decimal com vírgula).

// canônico → pt-BR. Funções sem entrada aqui são exibidas e aceitas pelo nome em inglês.
export const BR = {
  // matemática
  ABS: 'ABS', ACOS: 'ACOS', ACOSH: 'ACOSH', ACOT: 'ACOT', ACOTH: 'ACOTH', ASIN: 'ASEN', ASINH: 'ASENH', ATAN: 'ATAN', ATAN2: 'ATAN2', ATANH: 'ATANH',
  BASE: 'BASE', CEILING: 'TETO', 'CEILING.MATH': 'TETO.MAT', COMBIN: 'COMBIN', COS: 'COS', COSH: 'COSH', COT: 'COT', COTH: 'COTH', CSC: 'CSC', CSCH: 'CSCH',
  DECIMAL: 'DECIMAL', DEGREES: 'GRAUS', EVEN: 'PAR', EXP: 'EXP', FACT: 'FATORIAL', FACTDOUBLE: 'FATDUPLO', FLOOR: 'ARREDMULTB', 'FLOOR.MATH': 'ARREDMULTB.MAT',
  GCD: 'MDC', INT: 'INT', LCM: 'MMC', LN: 'LN', LOG: 'LOG', LOG10: 'LOG10', MOD: 'MOD', MROUND: 'MARRED', MULTINOMIAL: 'MULTINOMIAL', ODD: 'ÍMPAR', PI: 'PI',
  POWER: 'POTÊNCIA', PRODUCT: 'MULT', QUOTIENT: 'QUOCIENTE', RADIANS: 'RADIANOS', RAND: 'ALEATÓRIO', RANDBETWEEN: 'ALEATÓRIOENTRE', ROMAN: 'ROMANO',
  ROUND: 'ARRED', ROUNDDOWN: 'ARREDONDAR.PARA.BAIXO', ROUNDUP: 'ARREDONDAR.PARA.CIMA', SEC: 'SEC', SECH: 'SECH', SIGN: 'SINAL', SIN: 'SEN', SINH: 'SENH',
  SQRT: 'RAIZ', SQRTPI: 'RAIZPI', SUBTOTAL: 'SUBTOTAL', SUM: 'SOMA', SUMIF: 'SOMASE', SUMIFS: 'SOMASES', SUMPRODUCT: 'SOMARPRODUTO', SUMSQ: 'SOMAQUAD',
  SUMX2MY2: 'SOMAX2DY2', SUMX2PY2: 'SOMAX2SY2', SUMXMY2: 'SOMAXMY2', TAN: 'TAN', TANH: 'TANH', TRUNC: 'TRUNCAR', ARABIC: 'ARÁBICO', MMULT: 'MATRIZ.MULT',
  // lógicas
  AND: 'E', FALSE: 'FALSO', IF: 'SE', IFERROR: 'SEERRO', IFNA: 'SENÃODISP', IFS: 'SES', NOT: 'NÃO', OR: 'OU', SWITCH: 'PARÂMETRO', TRUE: 'VERDADEIRO', XOR: 'XOU',
  // estatística
  AVEDEV: 'DESV.MÉDIO', AVERAGE: 'MÉDIA', AVERAGEA: 'MÉDIAA', AVERAGEIF: 'MÉDIASE', 'BINOM.DIST': 'DISTR.BINOM.N', CORREL: 'CORREL',
  COUNT: 'CONT.NÚM', COUNTA: 'CONT.VALORES', COUNTBLANK: 'CONTAR.VAZIO', COUNTIF: 'CONT.SE', COUNTIFS: 'CONT.SES', DEVSQ: 'DESVQ', FISHER: 'FISHER',
  GEOMEAN: 'MÉDIA.GEOMÉTRICA', HARMEAN: 'MÉDIA.HARMÔNICA', LARGE: 'MAIOR', MAX: 'MÁXIMO', MAXA: 'MÁXIMOA', MAXIFS: 'MÁXIMOSES', MEDIAN: 'MED', MIN: 'MÍNIMO',
  MINA: 'MÍNIMOA', MINIFS: 'MÍNIMOSES', 'PERCENTILE.INC': 'PERCENTIL.INC', 'QUARTILE.INC': 'QUARTIL.INC', SLOPE: 'INCLINAÇÃO', RSQ: 'RQUAD', STDEV: 'DESVPAD', STDEVP: 'DESVPADP', VAR: 'VAR', VARP: 'VARP', PERCENTILE: 'PERCENTIL', QUARTILE: 'QUARTIL', 'STDEV.S': 'DESVPAD.A', 'STDEV.P': 'DESVPAD.P', 'VAR.S': 'VAR.A',
  'VAR.P': 'VAR.P', SMALL: 'MENOR', 'NORM.DIST': 'DIST.NORM.N', 'NORM.S.DIST': 'DIST.NORMP.N', 'NORM.INV': 'INV.NORM.N', 'NORM.S.INV': 'INV.NORMP.N',
  // texto
  CHAR: 'CARACT', CLEAN: 'TIRAR', CODE: 'CÓDIGO', CONCATENATE: 'CONCATENAR', EXACT: 'EXATO', FIND: 'PROCURAR', LEFT: 'ESQUERDA',
  LEN: 'NÚM.CARACT', LOWER: 'MINÚSCULA', MID: 'EXT.TEXTO', PROPER: 'PRI.MAIÚSCULA', REPLACE: 'MUDAR', REPT: 'REPT', RIGHT: 'DIREITA', SEARCH: 'LOCALIZAR',
  SUBSTITUTE: 'SUBSTITUIR', T: 'T', TEXT: 'TEXTO', TEXTJOIN: 'UNIRTEXTO', TRIM: 'ARRUMAR', UPPER: 'MAIÚSCULA', VALUE: 'VALOR', 
  UNICHAR: 'UNICAR', UNICODE: 'UNICODE',
  // data e hora
  DATE: 'DATA', DATEDIF: 'DATADIF', DATEVALUE: 'DATA.VALOR', DAY: 'DIA', DAYS: 'DIAS', DAYS360: 'DIAS360', EDATE: 'DATAM', EOMONTH: 'FIMMÊS', HOUR: 'HORA',
  MINUTE: 'MINUTO', MONTH: 'MÊS', NETWORKDAYS: 'DIATRABALHOTOTAL', NOW: 'AGORA', SECOND: 'SEGUNDO', TIME: 'TEMPO', TIMEVALUE: 'VALOR.TEMPO', TODAY: 'HOJE',
  WEEKDAY: 'DIA.DA.SEMANA', WEEKNUM: 'NÚMSEMANA', WORKDAY: 'DIATRABALHO', YEAR: 'ANO', YEARFRAC: 'FRAÇÃOANO',
  // busca e referência
  CHOOSE: 'ESCOLHER', COLUMN: 'COL', COLUMNS: 'COLS', HLOOKUP: 'PROCH', INDEX: 'ÍNDICE', MATCH: 'CORRESP', OFFSET: 'DESLOC', ROW: 'LIN', ROWS: 'LINS',
  VLOOKUP: 'PROCV', ADDRESS: 'ENDEREÇO', TRANSPOSE: 'TRANSPOR', FORMULATEXT: 'FÓRMULATEXTO',
  // informação
  ISBLANK: 'ÉCÉL.VAZIA', ISERR: 'ÉERROS', ISERROR: 'ÉERRO', ISEVEN: 'ÉPAR', ISODD: 'ÉIMPAR', ISLOGICAL: 'ÉLÓGICO', ISNA: 'É.NÃO.DISP', ISNONTEXT: 'É.NÃO.TEXTO',
  ISNUMBER: 'ÉNÚM', ISREF: 'ÉREF', ISTEXT: 'ÉTEXTO', N: 'N', NA: 'NÃO.DISP',
  // financeiras
  PMT: 'PGTO', FV: 'VF', PV: 'VP', NPV: 'VPL', IRR: 'TIR', RATE: 'TAXA', NPER: 'NPER', IPMT: 'IPGTO', PPMT: 'PPGTO', XNPV: 'XVPL', XIRR: 'XTIR', SLN: 'DPD',
  SYD: 'SDA', DB: 'BD', DDB: 'BDD', EFFECT: 'EFETIVA', NOMINAL: 'NOMINAL', MIRR: 'MTIR', CUMIPMT: 'PGTOJURACUM', CUMPRINC: 'PGTOCAPACUM', FVSCHEDULE: 'VFPLANO',
  PDURATION: 'DURAÇÃOP',
  // engenharia
  BIN2DEC: 'BINADEC', DEC2BIN: 'DECABIN', HEX2DEC: 'HEXADEC', DEC2HEX: 'DECAHEX', OCT2DEC: 'OCTADEC', DEC2OCT: 'DECAOCT', DELTA: 'DELTA', ERF: 'FUNERRO',
  ERFC: 'FUNERROCOMPL', BITAND: 'BITE', BITOR: 'BITOU', BITXOR: 'BITXOU', BITLSHIFT: 'DESLOCESQBIT', BITRSHIFT: 'DESLOCDIRBIT',
  COMPLEX: 'COMPLEXO', CONVERT: 'CONVERTER', CONCAT: 'CONCAT', RANK: 'ORDEM', MODE: 'MODO', INTERCEPT: 'INTERCEPÇÃO',
  // outras
  XLOOKUP: 'PROCX', SEQUENCE: 'SEQUÊNCIA', UNIQUE: 'ÚNICO', SORT: 'CLASSIFICAR', FILTER: 'FILTRO', ISFORMULA: 'ÉFÓRMULA', SHEET: 'PLAN', SHEETS: 'PLANS',
  HYPERLINK: 'HIPERLINK', ISOWEEKNUM: 'NÚMSEMANAISO', 'NETWORKDAYS.INTL': 'DIATRABALHOTOTAL.INTL', 'WORKDAY.INTL': 'DIATRABALHO.INTL', RRI: 'DEVOLVERTAXAJUROS',
  ISPMT: 'ÉPGTO', COMBINA: 'COMBINA', SERIESSUM: 'SOMASEQÜÊNCIA', BIN2OCT: 'BINAOCT', BIN2HEX: 'BINAHEX', OCT2BIN: 'OCTABIN', OCT2HEX: 'OCTAHEX', HEX2BIN: 'HEXABIN',
  HEX2OCT: 'HEXAOCT', 'CEILING.PRECISE': 'TETO.PRECISO', 'FLOOR.PRECISE': 'ARREDMULTB.PRECISO', 'COVARIANCE.P': 'COVARIAÇÃO.P', 'COVARIANCE.S': 'COVARIAÇÃO.S',
  SKEW: 'DISTORÇÃO', 'SKEW.P': 'DISTORÇÃO.P', PEARSON: 'PEARSON', STEYX: 'EPADYX', GAMMA: 'GAMA', GAMMALN: 'LNGAMA', 'T.TEST': 'TESTE.T', 'Z.TEST': 'TESTE.Z'
}

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()

const PARA_CANON = new Map()
for (const [canon, br] of Object.entries(BR)) PARA_CANON.set(semAcento(br), canon)
const CANONICOS = new Set(Object.keys(BR))

export const nomeLocal = (canon) => BR[canon] ?? canon
export const nomeCanonico = (nome) => {
  const k = semAcento(nome)
  return PARA_CANON.get(k) ?? k
}

const LETRA = /[A-Za-zÀ-ÿ_$]/
const PARTE = /[A-Za-zÀ-ÿ0-9_.$]/
const DIG = /[0-9]/

// dir: 'local' (canônico → pt-BR) ou 'canonico' (pt-BR/inglês → canônico)
function converter(texto, dir) {
  const local = dir === 'local'
  const decFonte = local ? '.' : ','
  const decDest = local ? ',' : '.'
  const sepFonte = local ? ',' : ';'
  const sepDest = local ? ';' : ','
  const numRe = local ? /^\d*\.?\d+(?:[eE][+-]?\d+)?/ : /^\d*,?\d+(?:[eE][+-]?\d+)?/
  let out = ''
  let i = 0
  let chaves = 0
  const n = texto.length
  while (i < n) {
    const c = texto[i]
    if (c === '"' || c === "'") {
      let j = i + 1
      while (j < n) {
        if (texto[j] === c) {
          if (texto[j + 1] === c) j += 2
          else break
        } else j++
      }
      out += texto.slice(i, j + 1)
      i = j + 1
      continue
    }
    if (c === '{') chaves++
    if (c === '}') chaves = Math.max(0, chaves - 1)
    if (chaves > 0) {
      out += c
      i++
      continue
    }
    if (LETRA.test(c)) {
      let j = i + 1
      while (j < n && PARTE.test(texto[j])) j++
      const id = texto.slice(i, j)
      const chamada = texto[j] === '('
      const up = id.toUpperCase()
      const bool = !chamada && (up === 'TRUE' || up === 'FALSE' || up === 'VERDADEIRO' || up === 'FALSO')
      if (chamada || bool) {
        const canon = local ? up : nomeCanonico(id)
        if (local && (canon === 'TRUE' || canon === 'FALSE') && texto.slice(j, j + 2) === '()') {
          out += nomeLocal(canon) // TRUE() aparece como VERDADEIRO
          i = j + 2
          continue
        }
        // o motor só entende TRUE() e FALSE(); o literal solto vira chamada
        out += local ? nomeLocal(canon) : bool ? `${canon}()` : canon
      } else out += id
      i = j
      continue
    }
    const antes = out.slice(-1)
    const inicioNumero = DIG.test(c) || ((c === decFonte) && DIG.test(texto[i + 1] ?? '') && !/[A-Za-z0-9_.$)\]]/.test(antes))
    if (inicioNumero) {
      const m = texto.slice(i).match(numRe)
      if (m) {
        out += m[0].replace(decFonte, decDest)
        i += m[0].length
        continue
      }
    }
    if (c === sepFonte) out += sepDest
    else out += c
    i++
  }
  return out
}

export const paraLocal = (f) => (typeof f === 'string' && f[0] === '=' ? converter(f, 'local') : f)
export const paraCanonico = (f) => (typeof f === 'string' && f[0] === '=' ? converter(f, 'canonico') : f)

export const ERROS = {
  '#NAME?': '#NOME?', '#VALUE!': '#VALOR!', '#DIV/0!': '#DIV/0!', '#REF!': '#REF!', '#N/A': '#N/D', '#NUM!': '#NÚM!', '#NULL!': '#NULO!', '#CYCLE!': '#CICLO!', '#ERROR!': '#ERRO!'
}
export const erroLocal = (v) => ERROS[v] ?? v

// lista de nomes locais de funções conhecidas (para sugestões)
export const NOMES_LOCAIS = Object.values(BR).sort((a, b) => a.localeCompare(b, 'pt-BR'))
export { CANONICOS }

// fórmulas vindas de arquivos .xlsx já usam nomes e separadores canônicos; só os literais TRUE/FALSE precisam virar chamadas
export function formulaDoXlsx(f) {
  return f.replace(/("(?:[^"]|"")*")|\b(TRUE|FALSE)\b(?!\s*\()/gi, (m, str, b) => (str ? str : `${b.toUpperCase()}()`))
}
