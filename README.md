# EngiSuite

Suíte de ferramentas de engenharia civil no navegador. Primeiro módulo: planilhas.

## Desenvolvimento

    npm install
    npm run dev

## Deploy no Cloudflare Pages

- Framework preset: None
- Build command: `npm run build`
- Build output directory: `dist`
- Variável de ambiente: `NODE_VERSION=22`

## Estrutura

- `src/lib/workbook.svelte.js`: estado, motor de fórmulas (HyperFormula) e salvamento local (IndexedDB)
- `src/lib/Grid.svelte`: grade em canvas virtualizada
- `src/lib/io.js`: importação e exportação (.xlsx, .csv)
- `src/modules/`: módulos de cálculo (cada um com `nome.js` puro e testado, e `Nome.svelte` com a tela), registrados em `index.js`:
  viga (flexão), cisalhamento, esforços e flecha (diagramas), laje (As por metro), pilar (esbeltez e compressão centrada),
  sapata (tensões no solo), ancoragem e emenda, propriedades de seção e conversor de unidades.
  Também: flecha em concreto (Branson e diferida), pilar em flexo-compressão (diagrama N-M) e perfil I de aço (NBR 8800). Resultados podem ser copiados ou impressos como memória de cálculo.
  Referência: NBR 6118:2014. São ferramentas de apoio e verificação: confira os resultados antes de usar em projeto.
- `src/cad/`: desenho 2D estilo CAD (linha, polilinha, retângulo, círculo, arco, texto, cota, mover, copiar, girar, espelhar, camadas, snaps, ortho, linha de comando). Importa e exporta DXF (ASCII; escrita R12) e exporta SVG. DWG é proprietário e não é lido: salve como DXF no AutoCAD.
  Linha de comando: `3;4` (absoluto), `@2;0` (relativo), `@5<45` (polar), `2,5` (distância); a vírgula é decimal.
- `src/viewer3d/`: mobiliar cômodos em 3D (three.js, carregado sob demanda): catálogo paramétrico, arrastar, girar, encostar na parede, colisões, vistas (3D, planta, frente, lado), PNG, salvar/abrir JSON.
- `src/app.css`: tokens e componentes do design de referência

## Atalhos

Setas, Tab, Enter, F2, Delete, Ctrl+Setas, Ctrl+C/X/V, Ctrl+Z/Y, Ctrl+A.

## Testes

    npm test

## Pendência de segurança: xlsx

O `xlsx@0.18.5` do npm tem vulnerabilidades conhecidas (prototype pollution e ReDoS) e não recebe mais correções lá.
A SheetJS publica as versões novas apenas no CDN deles. Para atualizar (a API é a mesma, sem mudanças no código):

    npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz

O `xlsx` já é carregado sob demanda (`import('xlsx')` em `src/lib/io.js`), em chunk separado.

## Fórmulas

As fórmulas seguem o Excel em português: `=SOMA(A1:A9)`, `=SE(A1>1,5;"ok";"não")`, `=PROCV(A1;Dados!A:C;3;FALSO)`.
Argumentos são separados por `;` e o decimal é a vírgula. Os nomes em inglês também são aceitos (`=SUM(A1;A2)`).

- Internamente o motor (HyperFormula, ~420 funções) guarda a forma canônica, a mesma do .xlsx; a tradução é feita só na digitação e na exibição (`src/lib/formulas.js`). Importar e exportar .xlsx não muda as fórmulas.
- Ao digitar `=` e o começo de um nome, aparecem sugestões (Tab insere) e a dica de sintaxe da função em edição. O botão **fx** abre a biblioteca com busca e categorias (`src/lib/catalogo.js`).
- Funções extras que o motor não tem: `CONVERTER` (unidades, incluindo kgf e tf), `CONCAT`, `ORDEM`, `MODO` e `INTERCEPÇÃO` (`src/lib/custom.js`).
- Erros aparecem em português (`#NOME?`, `#VALOR!`, `#DIV/0!`, `#N/D`).
- Os nomes em português seguem o Excel pt-BR. Funções sem tradução na tabela usam o nome em inglês.
