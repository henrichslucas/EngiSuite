import { fmtNum } from '../lib/util.js'

export const num = (t) => Number(String(t).trim().replace(',', '.'))
export const n2 = (v) => fmtNum(Math.round(v * 100) / 100)
export const n3 = (v) => fmtNum(Math.round(v * 1000) / 1000)
