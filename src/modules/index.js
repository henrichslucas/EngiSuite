import Viga from './Viga.svelte'
import Cisalhamento from './Cisalhamento.svelte'
import Esforcos from './Esforcos.svelte'
import Secao from './Secao.svelte'
import Ancoragem from './Ancoragem.svelte'
import Laje from './Laje.svelte'
import Pilar from './Pilar.svelte'
import Sapata from './Sapata.svelte'
import Unidades from './Unidades.svelte'

export const MODULOS = [
  { id: 'viga', nome: 'Viga: flexão', componente: Viga },
  { id: 'cisalhamento', nome: 'Viga: cisalhamento', componente: Cisalhamento },
  { id: 'esforcos', nome: 'Esforços e flecha', componente: Esforcos },
  { id: 'laje', nome: 'Laje', componente: Laje },
  { id: 'pilar', nome: 'Pilar', componente: Pilar },
  { id: 'sapata', nome: 'Sapata', componente: Sapata },
  { id: 'ancoragem', nome: 'Ancoragem', componente: Ancoragem },
  { id: 'secao', nome: 'Seções', componente: Secao },
  { id: 'unidades', nome: 'Unidades', componente: Unidades }
]
