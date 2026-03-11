export interface Segmento {
  id: string;
  nome: string;
  horasSemanais: number;
  percRepouso: number; // fraction, e.g. 1/6
  horasAtividade: number;
  valorHora: number;
  ajudaCusto: number;
}

export interface Professor {
  id: string;
  nome: string;
  cpf: string;
  dataAdmissao: string;
  horasSemanais?: number; // mantido para compat — mas agora vem de segmentoHoras
  segmentoHoras?: Record<string, number>; // segmentoId -> horas por semana
  valorHora?: number;
  ajudaCusto?: number;
  segmentoIds: string[];
  ativo: boolean;
}

export interface Lancamento {
  id: string;
  professorId: string;
  segmentoId: string;
  competencia: string; // "2026-03"
  horasMensais: number;
  repouso: number;
  horasAtividade: number;
  totalHoras: number;
  ajudaCusto: number;
  totalPagar: number;
  status: 'aberto' | 'fechado';
}

export interface Fechamento {
  id: string;
  competencia: string;
  dataFechamento: string;
  observacao: string;
  totalGeral: number;
}

export type Competencia = string; // "2026-03"

// Calculation engine
export function calcularHorasMensais(horasSemanais: number): number {
  return horasSemanais * 4.5;
}

export function calcularRepouso(horasMensais: number, percRepouso: number): number {
  return horasMensais * percRepouso;
}

export function calcularTotalHoras(horasMensais: number, repouso: number, horasAtividade: number): number {
  return horasMensais + repouso + horasAtividade;
}

export function calcularTotalPagar(totalHoras: number, valorHora: number, ajudaCusto: number): number {
  return totalHoras * valorHora + ajudaCusto;
}

function calcularPercentualHA(segmento: Segmento): number {
  const baseMensal = calcularHorasMensais(Number(segmento.horasSemanais) || 0);
  if (baseMensal === 0) return 0;
  return (Number(segmento.horasAtividade) || 0) / baseMensal;
}

export function gerarLancamento(
  professor: Professor,
  segmento: Segmento,
  competencia: string
): Omit<Lancamento, 'id'> {
  // Forçar Number() pois PostgreSQL NUMERIC retorna strings
  const horasBaseSemanais = Number(professor.segmentoHoras?.[segmento.id]) || Number(professor.horasSemanais) || Number(segmento.horasSemanais) || 0;
  const horasMensais = calcularHorasMensais(horasBaseSemanais);
  const percHA = calcularPercentualHA(segmento);
  const horasAtividade = Number((horasMensais * percHA).toFixed(2));
  // Novo cálculo: Repouso = (Mensal + H.A.) * percRepouso
  const percRepouso = Number(segmento.percRepouso) || 1 / 6;
  const repouso = calcularRepouso(horasMensais + horasAtividade, percRepouso);
  const totalHoras = calcularTotalHoras(horasMensais, repouso, horasAtividade);
  const valorHora = Number(professor.valorHora ?? segmento.valorHora) || 0;
  const ajudaCusto = Number(professor.ajudaCusto ?? segmento.ajudaCusto) || 0;
  const totalPagar = calcularTotalPagar(totalHoras, valorHora, ajudaCusto);

  return {
    professorId: professor.id,
    segmentoId: segmento.id,
    competencia,
    horasMensais: Number(horasMensais.toFixed(2)),
    repouso: Number(repouso.toFixed(2)),
    horasAtividade,
    totalHoras: Number(totalHoras.toFixed(2)),
    ajudaCusto,
    totalPagar: Number(totalPagar.toFixed(2)),
    status: 'aberto',
  };
}
