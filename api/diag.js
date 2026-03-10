const { getSql } = require('./_db');

module.exports = async (req, res) => {
  try {
    const raw = process.env.DATABASE_URL || '';
    const hasVar = Boolean(raw);
    const hasSpaces = /\s/.test(raw);
    const len = raw.length;

    let ping = null;
    let error = null;
    if (hasVar && !hasSpaces) {
      try {
        const sql = getSql();
        const r = await sql`select 1 as ok`;
        ping = r && r[0] && r[0].ok === 1 ? 'ok' : 'unexpected';
      } catch (e) {
        error = e.message || String(e);
      }
    }

    res.status(200).json({
      hasDatabaseUrl: hasVar,
      hasWhitespace: hasSpaces,
      valueLength: len,
      ping,
      error,
      tips: [
        'Value deve ser uma única linha, sem espaços',
        'Use sslmode=verify-full (sem channel_binding)',
        'Host deve terminar com -pooler.sa-east-1.aws.neon.tech'
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

