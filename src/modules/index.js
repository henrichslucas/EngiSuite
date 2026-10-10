import Viga from './Viga.svelte'
import Cisalhamento from './Cisalhamento.svelte'
import Esforcos from './Esforcos.svelte'
import Secao from './Secao.svelte'
import Ancoragem from './Ancoragem.svelte'
import Laje from './Laje.svelte'
import Pilar from './Pilar.svelte'
import Sapata from './Sapata.svelte'
import Flecha from './Flecha.svelte'
import PilarFlexo from './PilarFlexo.svelte'
import Aco from './Aco.svelte'
import Cad from '../cad/Cad.svelte'
import Viewer3D from '../viewer3d/Viewer3D.svelte'
import Unidades from './Unidades.svelte'

export const MODULOS = [
  { id: 'cad', nome: 'Desenho 2D (CAD)', componente: Cad },
  { id: 'mobiliar', nome: 'Mobiliar 3D', componente: Viewer3D },
  { id: 'viga', nome: 'Viga: flexão', componente: Viga },
  { id: 'cisalhamento', nome: 'Viga: cisalhamento', componente: Cisalhamento },
  { id: 'esforcos', nome: 'Esforços e flecha', componente: Esforcos },
  { id: 'flecha', nome: 'Flecha (concreto)', componente: Flecha },
  { id: 'laje', nome: 'Laje', componente: Laje },
  { id: 'pilar', nome: 'Pilar', componente: Pilar },
  { id: 'pilarflexo', nome: 'Pilar: flexo-compressão', componente: PilarFlexo },
  { id: 'aco', nome: 'Perfil de aço', componente: Aco },
  { id: 'sapata', nome: 'Sapata', componente: Sapata },
  { id: 'ancoragem', nome: 'Ancoragem', componente: Ancoragem },
  { id: 'secao', nome: 'Seções', componente: Secao },
  { id: 'unidades', nome: 'Unidades', componente: Unidades }
]

// Navegação em 4 áreas; as calculadoras ficam agrupadas no menu "Cálculos".
export const AREAS = [
  { id: 'planilhas', nome: 'Planilhas', icone: 'table' },
  { id: 'calculos', nome: 'Cálculos', icone: 'calc' },
  { id: 'cad', nome: 'Desenho 2D', icone: 'pen' },
  { id: 'mobiliar', nome: 'Ambientes 3D', icone: 'cube' }
]

export const CALC_GRUPOS = [
  { nome: 'Concreto armado', ids: ['viga', 'cisalhamento', 'flecha', 'laje', 'pilar', 'pilarflexo', 'ancoragem'] },
  { nome: 'Estruturas e fundações', ids: ['esforcos', 'secao', 'aco', 'sapata'] },
  { nome: 'Utilidades', ids: ['unidades'] }
]

export const CALC_IDS = CALC_GRUPOS.flatMap((g) => g.ids)
export const areaDe = (mod) => (mod === 'planilhas' || mod === 'cad' || mod === 'mobiliar' ? mod : 'calculos')
export const nomeDe = (id) => MODULOS.find((m) => m.id === id)?.nome ?? id
