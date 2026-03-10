import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { professores, segmentos, lancamentos, formatCurrency, formatCompetencia } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(220,65%,20%)', 'hsl(42,87%,55%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(260,60%,50%)'];

export default function DashboardPage() {
  const ativos = professores.filter((p) => p.ativo).length;
  const totalFolha = lancamentos.reduce((sum, l) => sum + l.totalPagar, 0);
  const totalHoras = lancamentos.reduce((sum, l) => sum + l.totalHoras, 0);
  const comp = lancamentos[0]?.competencia || '2026-03';

  // Per-segment chart data
  const segData = segmentos.map((seg) => {
    const segLancs = lancamentos.filter((l) => l.segmentoId === seg.id);
    return {
      nome: seg.nome,
      total: segLancs.reduce((s, l) => s + l.totalPagar, 0),
      horas: segLancs.reduce((s, l) => s + l.totalHoras, 0),
      professores: segLancs.length,
    };
  });

  const pieData = segData.filter((s) => s.total > 0);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Visão geral — Competência ${formatCompetencia(comp)}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Professores Ativos"
          value={String(ativos)}
          subtitle={`${professores.length} cadastrados`}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Total da Folha"
          value={formatCurrency(totalFolha)}
          subtitle={formatCompetencia(comp)}
          icon={<DollarSign className="w-5 h-5" />}
          variant="accent"
        />
        <StatCard
          title="Total de Horas"
          value={`${totalHoras.toFixed(1)}h`}
          subtitle="Horas calculadas"
          icon={<Clock className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          title="Segmentos"
          value={String(segmentos.length)}
          subtitle="Níveis de ensino"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Custo por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={segData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,25%,89%)" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214,25%,89%)' }}
                />
                <Bar dataKey="total" fill="hsl(220,65%,20%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribuição de Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="total"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
