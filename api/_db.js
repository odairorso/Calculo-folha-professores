import { neon } from '@neondatabase/serverless';

export function getSql() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL não definida no ambiente da Vercel/Local');
  }
  // Sanitiza problemas comuns: espaços, sslmode=require e channel_binding=require
  let url = String(raw).trim().replace(/\s+/g, '');
  url = url.replace(/([?&])channel_binding=require(&|$)/gi, '$1');
  url = url.replace(/\?&/, '?').replace(/&+$/, '').replace(/\?$/, '');
  if (/sslmode=require/i.test(url)) {
    url = url.replace(/sslmode=require/gi, 'sslmode=verify-full');
  } else if (!/sslmode=/i.test(url)) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=verify-full';
  }
  return neon(url);
}
