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
- `src/app.css`: tokens e componentes do design de referência

## Atalhos

Setas, Tab, Enter, F2, Delete, Ctrl+Setas, Ctrl+C/X/V, Ctrl+Z/Y, Ctrl+A.
