import { gerarLancamento, Segmento, Professor } from './types';

describe('gerarLancamento com horas do professor', () => {
  const segmento: Segmento = {
    id: 's1',
    nome: 'Teste',
    horasSemanais: 10,
    percRepouso: 1 / 6,
    horasAtividade: 2,
    valorHora: 20,
    ajudaCusto: 0,
  };

  const professor: Professor = {
    id: 'p1',
    nome: 'Prof',
    cpf: '000.000.000-00',
    dataAdmissao: '2024-01-01',
    horasSemanais: 12, // deve sobrepor as horas do segmento
    segmentoIds: ['s1'],
    ativo: true,
  };

  it('usa horasSemanais do professor quando presentes', () => {
    const lanc = gerarLancamento(professor, segmento, '2026-03');
    expect(lanc.horasMensais).toBeCloseTo(12 * 4.5, 2);
  });

  it('mantém cálculo com base no segmento quando horas do professor ausentes', () => {
    const profSemHoras: Professor = { ...professor, horasSemanais: undefined };
    const lanc = gerarLancamento(profSemHoras, segmento, '2026-03');
    expect(lanc.horasMensais).toBeCloseTo(10 * 4.5, 2);
  });
});

describe('gerarLancamento com valorHora do professor', () => {
  const segmento: Segmento = {
    id: 's1',
    nome: 'Teste',
    horasSemanais: 10,
    percRepouso: 1 / 6,
    horasAtividade: 2,
    valorHora: 20,
    ajudaCusto: 0,
  };

  const base: Professor = {
    id: 'p1',
    nome: 'Prof',
    cpf: '000.000.000-00',
    dataAdmissao: '2024-01-01',
    segmentoIds: ['s1'],
    ativo: true,
  };

  it('usa valorHora do professor quando presente', () => {
    const prof = { ...base, horasSemanais: 10, valorHora: 30 };
    const lanc = gerarLancamento(prof, segmento, '2026-03');
    expect(lanc.totalPagar).toBeGreaterThan(0);
    const profSeg = { ...base, horasSemanais: 10 };
    const lancSeg = gerarLancamento(profSeg, segmento, '2026-03');
    expect(lanc.totalPagar).toBeGreaterThan(lancSeg.totalPagar);
  });
});

describe('gerarLancamento com ajudaCusto do professor', () => {
  const segmento: Segmento = {
    id: 's1',
    nome: 'Teste',
    horasSemanais: 10,
    percRepouso: 1 / 6,
    horasAtividade: 2,
    valorHora: 20,
    ajudaCusto: 0,
  };

  const base: Professor = {
    id: 'p1',
    nome: 'Prof',
    cpf: '000.000.000-00',
    dataAdmissao: '2024-01-01',
    segmentoIds: ['s1'],
    ativo: true,
  };

  it('soma ajudaCusto do professor ao total', () => {
    const prof = { ...base, horasSemanais: 10, ajudaCusto: 100 };
    const lanc = gerarLancamento(prof, segmento, '2026-03');
    expect(lanc.ajudaCusto).toBe(100);
    const profZero = { ...base, horasSemanais: 10, ajudaCusto: 0 };
    const lancZero = gerarLancamento(profZero, segmento, '2026-03');
    expect(lanc.totalPagar).toBeGreaterThan(lancZero.totalPagar);
  });
});

describe('horasAtividade dinâmicas por percentual do segmento', () => {
  const segmento5: Segmento = {
    id: 's5pct',
    nome: '5%',
    horasSemanais: 10, // 45 mensais
    percRepouso: 1/6,
    horasAtividade: 2.25, // 5% de 45
    valorHora: 20,
    ajudaCusto: 0,
  };
  const segmento20: Segmento = {
    id: 's20pct',
    nome: '20%',
    horasSemanais: 10, // 45 mensais
    percRepouso: 1/6,
    horasAtividade: 9, // 20% de 45
    valorHora: 20,
    ajudaCusto: 0,
  };
  const prof: Professor = {
    id: 'pa',
    nome: 'A',
    cpf: '0',
    dataAdmissao: '2024-01-01',
    segmentoIds: ['s5pct'],
    ativo: true,
    horasSemanais: 12, // 54 mensais
  };
  it('aplica 5% sobre horas mensais quando segmento de 5%', () => {
    const lanc = gerarLancamento({ ...prof, segmentoIds: ['s5pct'] }, segmento5, '2026-03');
    expect(lanc.horasAtividade).toBeCloseTo(54 * 0.05, 2);
  });
  it('aplica 20% sobre horas mensais quando segmento de 20%', () => {
    const lanc = gerarLancamento({ ...prof, segmentoIds: ['s20pct'] }, segmento20, '2026-03');
    expect(lanc.horasAtividade).toBeCloseTo(54 * 0.2, 2);
  });
});
