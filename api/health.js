import { getSql } from './_db.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();
    const rows = await sql`select 1 as ok`;
    res.status(200).json({ ok: rows[0]?.ok === 1 });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
