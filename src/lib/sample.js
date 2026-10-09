export const sampleName = 'Quantitativos'

export const sampleWidths = { 0: 56, 1: 260, 2: 56, 3: 88, 4: 130, 5: 130 }

export const sampleData = [
  ['Item', 'Descrição', 'Un', 'Qtd', 'Preço unit. (R$)', 'Total (R$)'],
  [1, 'Escavação manual de valas', 'm³', 42.5, 68.9, '=D2*E2'],
  [2, 'Concreto estrutural fck 25 MPa', 'm³', 18.4, 412, '=D3*E3'],
  [3, 'Aço CA-50', 'kg', 1250, 9.35, '=D4*E4'],
  [4, 'Forma de madeira', 'm²', 96, 78.4, '=D5*E5'],
  [5, 'Alvenaria de bloco cerâmico', 'm²', 210, 74.2, '=D6*E6'],
  [6, 'Chapisco', 'm²', 420, 6.8, '=D7*E7'],
  [null, 'Total geral', null, null, null, '=SUM(F2:F7)']
]
