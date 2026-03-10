import { Segmento, Professor, Lancamento, Fechamento, gerarLancamento } from './types';

export const segmentos: Segmento[] = [
  { id: 's1', nome: 'Berçário I', horasSemanais: 10, percRepouso: 1/6, horasAtividade: 2.25, valorHora: 17.68, ajudaCusto: 10 },
  { id: 's2', nome: 'Berçário II', horasSemanais: 10, percRepouso: 1/6, horasAtividade: 2.25, valorHora: 17.68, ajudaCusto: 0 },
  { id: 's3', nome: 'Ed. Infantil', horasSemanais: 10, percRepouso: 1/6, horasAtividade: 2.25, valorHora: 17.68, ajudaCusto: 0 },
  { id: 's4', nome: 'Fund. I', horasSemanais: 10, percRepouso: 1/6, horasAtividade: 2.25, valorHora: 19.59, ajudaCusto: 0 },
  { id: 's5', nome: 'Fund. II', horasSemanais: 10, percRepouso: 1/6, horasAtividade: 9, valorHora: 26.32, ajudaCusto: 0 },
  { id: 's6', nome: 'Ens. Médio', horasSemanais: 10, percRepouso: 1/6, horasAtividade: 9, valorHora: 26.32, ajudaCusto: 0 },
];

export const professores: Professor[] = [
  { id: 'p1', nome: 'Ana Silva', cpf: '123.456.789-00', dataAdmissao: '2020-02-01', segmentoIds: ['s1'], ativo: true },
  { id: 'p2', nome: 'Carlos Oliveira', cpf: '234.567.890-11', dataAdmissao: '2019-03-15', segmentoIds: ['s2'], ativo: true },
  { id: 'p3', nome: 'Maria Santos', cpf: '345.678.901-22', dataAdmissao: '2021-01-10', segmentoIds: ['s3'], ativo: true },
  { id: 'p4', nome: 'José Pereira', cpf: '456.789.012-33', dataAdmissao: '2018-07-20', segmentoIds: ['s4'], ativo: true },
  { id: 'p5', nome: 'Fernanda Lima', cpf: '567.890.123-44', dataAdmissao: '2022-02-01', segmentoIds: ['s5'], ativo: true },
  { id: 'p6', nome: 'Roberto Costa', cpf: '678.901.234-55', dataAdmissao: '2017-08-01', segmentoIds: ['s6'], ativo: true },
  { id: 'p7', nome: 'Patrícia Alves', cpf: '789.012.345-66', dataAdmissao: '2023-01-15', segmentoIds: ['s5', 's6'], ativo: true },
  { id: 'p8', nome: 'Lucas Mendes', cpf: '890.123.456-77', dataAdmissao: '2020-06-01', segmentoIds: ['s1', 's3'], ativo: false },
];

// Generate lancamentos for current month
const comp = '2026-03';
export const lancamentos: Lancamento[] = [];

professores.forEach((prof) => {
  prof.segmentoIds.forEach((segId) => {
    const seg = segmentos.find((s) => s.id === segId)!;
    const lanc = gerarLancamento(prof, seg, comp);
    lancamentos.push({ ...lanc, id: `l-${prof.id}-${segId}-${comp}` });
  });
});

export const fechamentos: Fechamento[] = [
  {
    id: 'f1',
    competencia: '2026-02',
    dataFechamento: '2026-02-28',
    observacao: 'Fechamento regular',
    totalGeral: 7223.85,
  },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatCompetencia(comp: string): string {
  const [year, month] = comp.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]}/${year}`;
}
