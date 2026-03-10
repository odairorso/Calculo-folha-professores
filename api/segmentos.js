const { getSql } = require('./_db');

module.exports = async (req, res) => {
  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const segmentos = await sql`
        select id, nome, horas_semanais as "horasSemanais",
               perc_repouso as "percRepouso",
               ha_percent as "haPercent",
               valor_hora as "valorHora",
               ajuda_custo as "ajudaCusto"
        from segmentos
        order by nome
      `;
      res.status(200).json(segmentos);
      return;
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { id, horasSemanais, valorHora, ajudaCusto, haPercent } = body;
      if (!id) {
        res.status(400).json({ error: 'id é obrigatório' });
        return;
      }
      // Atualiza apenas os campos informados
      if (horasSemanais != null) {
        await sql`update segmentos set horas_semanais = ${horasSemanais} where id = ${id}`;
      }
      if (valorHora != null) {
        await sql`update segmentos set valor_hora = ${valorHora} where id = ${id}`;
      }
      if (ajudaCusto != null) {
        await sql`update segmentos set ajuda_custo = ${ajudaCusto} where id = ${id}`;
      }
      if (haPercent != null) {
        await sql`update segmentos set ha_percent = ${haPercent} where id = ${id}`;
      }
      const updated = await sql`
        select id, nome, horas_semanais as "horasSemanais",
               perc_repouso as "percRepouso",
               ha_percent as "haPercent",
               valor_hora as "valorHora",
               ajuda_custo as "ajudaCusto"
        from segmentos
        where id = ${id}
      `;
      res.status(200).json(updated[0] || null);
      return;
    }

    res.status(405).json({ error: 'Método não suportado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
