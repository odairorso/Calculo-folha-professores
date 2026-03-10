const { neon } = require('@neondatabase/serverless');

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL não definida no ambiente da Vercel/Local');
  }
  return neon(url);
}

module.exports = { getSql };

