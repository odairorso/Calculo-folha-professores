const { getSql } = require('./_db');

module.exports = async (req, res) => {
  try {
    const sql = getSql();
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

