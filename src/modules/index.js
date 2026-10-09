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
