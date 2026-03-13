import { Pool } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL não definida. Configure a variável de ambiente e execute novamente.');
  process.exit(1);
}

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

const ddl = `
-- Extensões
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela de segmentos (Ano)
CREATE TABLE IF NOT EXISTS segmentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  horas_semanais NUMERIC(10,2) NOT NULL DEFAULT 10,
  perc_repouso NUMERIC(10,4) NOT NULL DEFAULT 0.1667,
  ha_percent NUMERIC(10,4) NOT NULL DEFAULT 0.05,
  valor_hora NUMERIC(10,2) NOT NULL DEFAULT 0,
  ajuda_custo NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Tabela de professores
CREATE TABLE IF NOT EXISTS professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
  horas_semanais NUMERIC(10,2),
  valor_hora NUMERIC(10,2),
  ajuda_custo NUMERIC(10,2),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Relacionamento N:N professor <-> segmento
CREATE TABLE IF NOT EXISTS professor_segmentos (
  professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  segmento_id UUID NOT NULL REFERENCES segmentos(id) ON DELETE CASCADE,
  horas_semanais NUMERIC(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (professor_id, segmento_id)
);

-- Lançamentos mensais
CREATE TABLE IF NOT EXISTS lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  segmento_id UUID NOT NULL REFERENCES segmentos(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL, -- YYYY-MM
  horas_mensais NUMERIC(10,2) NOT NULL,
  repouso NUMERIC(10,2) NOT NULL,
  horas_atividade NUMERIC(10,2) NOT NULL,
  total_horas NUMERIC(10,2) NOT NULL,
  ajuda_custo NUMERIC(10,2) NOT NULL,
  total_pagar NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto',
  CONSTRAINT lanc_status_chk CHECK (status IN ('aberto','fechado'))
);

-- Fechamentos
CREATE TABLE IF NOT EXISTS fechamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia TEXT NOT NULL,
  data_fechamento DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao TEXT,
  total_geral NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lanc_prof_comp ON lancamentos (professor_id, competencia);
CREATE INDEX IF NOT EXISTS idx_lanc_seg_comp ON lancamentos (segmento_id, competencia);
`;

const seeds = [
  // nome, horas_semanais, perc_repouso, ha_percent, valor_hora, ajuda_custo
  ['Berçário I', 10, 1/6, 0.05, 17.68, 10.00],
  ['Berçário II', 10, 1/6, 0.05, 17.68, 0.00],
  ['Ed. Infantil', 10, 1/6, 0.05, 17.68, 0.00],
  ['Fund. I', 10, 1/6, 0.05, 19.59, 0.00],
  ['Fund. II', 10, 1/6, 0.20, 26.32, 0.00],
  ['Ens. Médio', 10, 1/6, 0.20, 26.32, 0.00],
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(ddl);
    // Seed de segmentos (idempotente)
    for (const [nome, hs, pr, ha, vh, aj] of seeds) {
      await client.query(
        `INSERT INTO segmentos (nome, horas_semanais, perc_repouso, ha_percent, valor_hora, ajuda_custo)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (nome)
         DO UPDATE SET horas_semanais = EXCLUDED.horas_semanais,
                       perc_repouso   = EXCLUDED.perc_repouso,
                       ha_percent     = EXCLUDED.ha_percent,
                       valor_hora     = EXCLUDED.valor_hora,
                       ajuda_custo    = EXCLUDED.ajuda_custo`,
        [nome, hs, pr, ha, vh, aj]
      );
    }
    await client.query('COMMIT');
    console.log('Migração concluída com sucesso.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro na migração:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
