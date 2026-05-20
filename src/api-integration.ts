const CN_INTELLIGENCE_URL = import.meta.env.VITE_CN_INTELLIGENCE_URL || 'http://localhost:3000';
const INTEGRATION_TOKEN = import.meta.env.VITE_FOLHA_INTEGRATION_TOKEN || 'DEFAULT_FOLHA_INTEGRATION_TOKEN_123';

export async function pushFolhaToFluxoDeCaixa(competencia: string, totalPagar: number, obs: string) {
  // Ajusta vencimento para o dia 05 do mês seguinte
  const [anoStr, mesStr] = competencia.split('-');
  let ano = parseInt(anoStr, 10);
  let mes = parseInt(mesStr, 10) + 1;
  if (mes > 12) {
    mes = 1;
    ano += 1;
  }
  const vencimento = `${ano}-${String(mes).padStart(2, '0')}-05`;

  const payload = {
    competencia,
    empresa: 'Geral', // Poderia separar por segmento/empresa se necessário
    totalPagar,
    vencimento,
    fornecedor: `Folha de Pagamento Professores - ${competencia}`,
    descricao: obs || `Integração Folha de Pagamento ${competencia}`
  };

  const response = await fetch(`${CN_INTELLIGENCE_URL}/api?route=folha-push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INTEGRATION_TOKEN}`,
      'x-cn-security': 'CN-INT-2024-SECURE-HARDENED-V1' // Token padrão da rota, se exigido pelo firewall (embora folha-push não precise por causa do JWT bypass que fiz)
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na integração (HTTP ${response.status})`);
  }

  return response.json();
}
