# Cálculo Salário Professores

Aplicação React + Vite + TypeScript para cálculo de horas e salários por professor e segmento (Ano), com exportação PDF/CSV, cadastro com overrides por professor e geração automática de lançamentos.

## Scripts
- `npm run dev` — ambiente de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — preview do build
- `npm run db:migrate` — aplica schema e seeds no PostgreSQL (Neon)

## Banco de Dados (Neon)
1. Defina `DATABASE_URL` no ambiente (não commitar):
   - `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`
2. Execute: `npm run db:migrate`
3. Tabelas criadas: `segmentos`, `professores`, `professor_segmentos`, `lancamentos`, `fechamentos`
   - Seeds de segmentos com percentuais de H.A.: Berçário I→Fund. I = 5%, Fund. II/Médio = 20%

## Deploy na Vercel
Projeto é SPA com React Router. Já incluído `vercel.json` para rewrites (fallback em `/index.html`).

1. Crie o projeto na Vercel e conecte ao repositório GitHub
2. Configurações:
   - Framework: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Variáveis de Ambiente (se for usar APIs/serverless futuramente):
   - `DATABASE_URL` (não use no front-end diretamente)
4. Deploy
   - A cada push na `main`, a Vercel faz o deploy

## Observações
- PDF: botão “Exportar PDF” em Relatórios abre uma janela pronta para “Salvar como PDF”
- CSV: também disponível em Relatórios
- Cálculo:
  - Horas Mensais = Horas Semanais × 4,5
  - Repouso = 1/6 das mensais
  - H.A. = percentual por segmento aplicado sobre Horas Mensais (5% ou 20%)
  - Total a Pagar = Total Horas × Valor/Hora + Ajuda de Custo

