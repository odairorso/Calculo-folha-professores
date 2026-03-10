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
  horasSemanais?: number;
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
  const baseMensal = calcularHorasMensais(segmento.horasSemanais);
  if (baseMensal === 0) return 0;
  return segmento.horasAtividade / baseMensal;
}

export function gerarLancamento(
  professor: Professor,
  segmento: Segmento,
  competencia: string
): Omit<Lancamento, 'id'> {
  const horasBaseSemanais = professor.horasSemanais ?? segmento.horasSemanais;
  const horasMensais = calcularHorasMensais(horasBaseSemanais);
  const repouso = calcularRepouso(horasMensais, segmento.percRepouso);
  const percHA = calcularPercentualHA(segmento);
  const horasAtividade = Number((horasMensais * percHA).toFixed(2));
  const totalHoras = calcularTotalHoras(horasMensais, repouso, horasAtividade);
  const valorHora = professor.valorHora ?? segmento.valorHora;
  const ajudaCusto = professor.ajudaCusto ?? segmento.ajudaCusto;
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
