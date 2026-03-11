import { getSql } from './_db.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();
    if (req.method === 'GET') {
      const profs = await sql`
        select id, nome, cpf, data_admissao as "dataAdmissao",
               valor_hora as "valorHora",
               ajuda_custo as "ajudaCusto",
               ativo
        from professores
        order by nome
      `;
      const links = await sql`
        select professor_id as "professorId",
               segmento_id as "segmentoId",
               horas_semanais as "horasSemanais"
        from professor_segmentos
      `;
      const byProf = new Map();
      for (const p of profs) {
        byProf.set(p.id, { ...p, segmentoIds: [], segmentoHoras: {} });
      }
      for (const l of links) {
        const item = byProf.get(l.professorId);
        if (item) {
          item.segmentoIds.push(l.segmentoId);
          item.segmentoHoras[l.segmentoId] = Number(l.horasSemanais) || 0;
        }
      }
      res.status(200).json(Array.from(byProf.values()));
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { nome, cpf, dataAdmissao, valorHora, ajudaCusto, segmentos: segsInput } = body;
      // segsInput = [{ segmentoId, horasSemanais }, ...]
      if (!nome || !cpf || !segsInput || segsInput.length === 0) {
        res.status(400).json({ error: 'nome, cpf e ao menos um segmento são obrigatórios' });
        return;
      }
      const inserted = await sql`
        insert into professores (nome, cpf, data_admissao, valor_hora, ajuda_custo, ativo)
        values (${nome}, ${cpf}, ${dataAdmissao || new Date()}, ${valorHora || null}, ${ajudaCusto || 0}, true)
        returning id
      `;
      const id = inserted[0].id;
      for (const s of segsInput) {
        if (s.segmentoId) {
          await sql`
            insert into professor_segmentos (professor_id, segmento_id, horas_semanais)
            values (${id}, ${s.segmentoId}, ${s.horasSemanais || 0})
          `;
        }
      }
      res.status(201).json({ id });
      return;
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { id, nome, cpf, dataAdmissao, valorHora, ajudaCusto, ativo, segmentos: segsInput } = body;
      if (!id) {
        res.status(400).json({ error: 'id é obrigatório' });
        return;
      }
      if (nome != null) await sql`update professores set nome = ${nome} where id = ${id}`;
      if (cpf != null) await sql`update professores set cpf = ${cpf} where id = ${id}`;
      if (dataAdmissao != null) await sql`update professores set data_admissao = ${dataAdmissao} where id = ${id}`;
      if (valorHora != null) await sql`update professores set valor_hora = ${valorHora} where id = ${id}`;
      if (ajudaCusto != null) await sql`update professores set ajuda_custo = ${ajudaCusto} where id = ${id}`;
      if (ativo != null) await sql`update professores set ativo = ${ativo} where id = ${id}`;
      // Atualizar segmentos: apaga todos e reinsere
      if (segsInput != null) {
        await sql`delete from professor_segmentos where professor_id = ${id}`;
        for (const s of segsInput) {
          if (s.segmentoId) {
            await sql`
              insert into professor_segmentos (professor_id, segmento_id, horas_semanais)
              values (${id}, ${s.segmentoId}, ${s.horasSemanais || 0})
            `;
          }
        }
      }
      res.status(204).end();
      return;
    }

    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { id } = body;
      if (!id) {
        res.status(400).json({ error: 'id é obrigatório' });
        return;
      }
      await sql`delete from professores where id = ${id}`;
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'Método não suportado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
