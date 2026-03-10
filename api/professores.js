const { getSql } = require('./_db');

module.exports = async (req, res) => {
  try {
    const sql = getSql();
    if (req.method === 'GET') {
      const profs = await sql`
        select id, nome, cpf, data_admissao as "dataAdmissao",
               horas_semanais as "horasSemanais",
               valor_hora as "valorHora",
               ajuda_custo as "ajudaCusto",
               ativo
        from professores
        order by nome
      `;
      const links = await sql`
        select professor_id as "professorId", segmento_id as "segmentoId"
        from professor_segmentos
      `;
      const byProf = new Map();
      for (const p of profs) {
        byProf.set(p.id, { ...p, segmentoIds: [] });
      }
      for (const l of links) {
        const item = byProf.get(l.professorId);
        if (item) item.segmentoIds.push(l.segmentoId);
      }
      res.status(200).json(Array.from(byProf.values()));
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const {
        nome, cpf, dataAdmissao, horasSemanais, valorHora, ajudaCusto, segmentoId,
      } = body;
      if (!nome || !cpf || !segmentoId || !horasSemanais) {
        res.status(400).json({ error: 'nome, cpf, segmentoId e horasSemanais são obrigatórios' });
        return;
      }
      const inserted = await sql`
        insert into professores (nome, cpf, data_admissao, horas_semanais, valor_hora, ajuda_custo, ativo)
        values (${nome}, ${cpf}, ${dataAdmissao || new Date()}, ${horasSemanais}, ${valorHora || null}, ${ajudaCusto || 0}, true)
        returning id
      `;
      const id = inserted[0].id;
      await sql`
        insert into professor_segmentos (professor_id, segmento_id)
        values (${id}, ${segmentoId})
      `;
      res.status(201).json({ id });
      return;
    }

    res.status(405).json({ error: 'Método não suportado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

