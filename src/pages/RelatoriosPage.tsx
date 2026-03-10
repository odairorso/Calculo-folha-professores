import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatCompetencia } from '@/lib/mockData';
import { useSegmentos, initSegmentosFromApi } from '@/lib/segmentosStore';
import { gerarLancamento, Lancamento } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfessores } from '@/lib/store';
import { FileDown } from 'lucide-react';

export default function RelatoriosPage() {
  const profs = useProfessores();
  const segmentos = useSegmentos();
  const [comp, setComp] = useState('2026-03');
  const [compLancs, setCompLancs] = useState<Lancamento[]>([]);

  useEffect(() => {
    initSegmentosFromApi();
  }, []);

  const recalcular = () => {
    const list: Lancamento[] = [];
    profs.filter(p => p.ativo).forEach(p => {
      p.segmentoIds.forEach(segId => {
        const seg = segmentos.find(s => s.id === segId);
        if (!seg) return;
        const l = gerarLancamento(p, seg, comp);
        list.push({ ...l, id: `l-${p.id}-${segId}-${comp}` });
      });
    });
    setCompLancs(list);
  };

  useEffect(() => {
    recalcular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profs, comp]);

  // Consolidado por segmento
  const segData = useMemo(() => {
    return segmentos.map((seg) => {
      const segLancs = compLancs.filter((l) => l.segmentoId === seg.id);
      return {
        segmento: seg.nome,
        professores: segLancs.length,
        totalHoras: segLancs.reduce((s, l) => s + l.totalHoras, 0),
        totalPagar: segLancs.reduce((s, l) => s + l.totalPagar, 0),
      };
    }).filter((s) => s.professores > 0);
  }, [compLancs]);

  const totalGeral = useMemo(() => compLancs.reduce((s, l) => s + l.totalPagar, 0), [compLancs]);

  // Totais por professor (mensal)
  const totaisPorProfessor = useMemo(() => {
    const map = new Map<string, { nome: string; totalHoras: number; totalPagar: number }>();
    compLancs.forEach((l) => {
      const p = profs.find((pp) => pp.id === l.professorId);
      const nome = p?.nome ?? l.professorId;
      const cur = map.get(l.professorId) ?? { nome, totalHoras: 0, totalPagar: 0 };
      cur.totalHoras += l.totalHoras;
      cur.totalPagar += l.totalPagar;
      map.set(l.professorId, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [compLancs, profs]);

  const exportCSV = () => {
    const header1 = 'Professor,Segmento,Hrs Mensais,Repouso,H.A.,Total Hrs,Ajuda Custo,Total Pagar\n';
    const rows1 = compLancs.map((l) => {
      const prof = profs.find((p) => p.id === l.professorId);
      const seg = segmentos.find((s) => s.id === l.segmentoId);
      return `${prof?.nome},${seg?.nome},${l.horasMensais},${l.repouso},${l.horasAtividade},${l.totalHoras},${l.ajudaCusto},${l.totalPagar}`;
    }).join('\n');
    const header2 = '\n\nTotais por Professor\nProfessor,Total Horas,Total a Pagar\n';
    const rows2 = totaisPorProfessor.map((r) => `${r.nome},${r.totalHoras.toFixed(2)},${r.totalPagar.toFixed(2)}`).join('\n');
    const blob = new Blob([header1 + rows1 + header2 + rows2], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${comp}.csv`;
    a.click();
  };

  const exportPDF = () => {
    const title = `Relatório — ${formatCompetencia(comp)}`;
    const win = window.open('', '_blank');
    if (!win) return;
    const style = `
      <style>
        *{font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;}
        h1{font-size:20px;margin:0 0 12px;}
        h2{font-size:16px;margin:20px 0 8px;}
        table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px;}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:right;}
        th:first-child, td:first-child{text-align:left;}
        tfoot td{font-weight:700;}
      </style>
    `;
    const segRows = segData.map(s => `
      <tr>
        <td>${s.segmento}</td>
        <td>${s.professores}</td>
        <td>${s.totalHoras.toFixed(2)}h</td>
        <td>${formatCurrency(s.totalPagar)}</td>
      </tr>
    `).join('');
    const totProfRows = totaisPorProfessor.map(r => `
      <tr>
        <td>${r.nome}</td>
        <td>${r.totalHoras.toFixed(2)}h</td>
        <td>${formatCurrency(r.totalPagar)}</td>
      </tr>
    `).join('');
    const detRows = compLancs.map(l => {
      const p = profs.find(pp => pp.id === l.professorId);
      const seg = segmentos.find(s => s.id === l.segmentoId);
      return `
        <tr>
          <td>${p?.nome ?? ''}</td>
          <td>${seg?.nome ?? ''}</td>
          <td>${l.horasMensais}h</td>
          <td>${l.repouso}h</td>
          <td>${l.horasAtividade}h</td>
          <td>${l.totalHoras}h</td>
          <td>${formatCurrency(l.ajudaCusto)}</td>
          <td>${formatCurrency(l.totalPagar)}</td>
        </tr>
      `;
    }).join('');
    const html = `
      <html>
        <head><title>${title}</title>${style}</head>
        <body>
          <h1>${title}</h1>
          <h2>Consolidado por Segmento</h2>
          <table>
            <thead><tr><th>Segmento</th><th>Professores</th><th>Total Horas</th><th>Total a Pagar</th></tr></thead>
            <tbody>${segRows}</tbody>
            <tfoot><tr><td colspan="3">Total Geral</td><td>${formatCurrency(totalGeral)}</td></tr></tfoot>
          </table>
          <h2>Totais por Professor (Mensal)</h2>
          <table>
            <thead><tr><th>Professor</th><th>Total Horas</th><th>Total a Pagar</th></tr></thead>
            <tbody>${totProfRows}</tbody>
          </table>
          <h2>Detalhamento por Professor</h2>
          <table>
            <thead><tr><th>Professor</th><th>Segmento</th><th>Hrs Mensais</th><th>Repouso</th><th>H.A.</th><th>Total Hrs</th><th>Ajuda Custo</th><th>Total a Pagar</th></tr></thead>
            <tbody>${detRows}</tbody>
          </table>
          <script>window.onload = () => setTimeout(() => { window.print(); }, 100);</script>
        </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description={`Relatório consolidado — ${formatCompetencia(comp)}`}
        actions={
          <div className="flex items-center gap-3">
            <Select value={comp} onValueChange={setComp}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-01">Jan/2026</SelectItem>
                <SelectItem value="2026-02">Fev/2026</SelectItem>
                <SelectItem value="2026-03">Mar/2026</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportPDF}>
              <FileDown className="w-4 h-4 mr-2" />Exportar PDF
            </Button>
            <Button onClick={exportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />Exportar CSV
            </Button>
          </div>
        }
      />

      {/* Consolidado por segmento */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Consolidado por Segmento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segmento</TableHead>
                <TableHead className="text-right">Professores</TableHead>
                <TableHead className="text-right">Total Horas</TableHead>
                <TableHead className="text-right">Total a Pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segData.map((s) => (
                <TableRow key={s.segmento}>
                  <TableCell className="font-medium">{s.segmento}</TableCell>
                  <TableCell className="text-right">{s.professores}</TableCell>
                  <TableCell className="text-right">{s.totalHoras.toFixed(2)}h</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(s.totalPagar)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={3} className="text-right">Total Geral</TableCell>
                <TableCell className="text-right text-lg">{formatCurrency(totalGeral)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Custo por Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={segData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,25%,89%)" />
              <XAxis dataKey="segmento" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="totalPagar" fill="hsl(220,65%,20%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Individual detalhado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por Professor</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead className="text-right">Hrs Mensais</TableHead>
                <TableHead className="text-right">Repouso</TableHead>
                <TableHead className="text-right">H.A.</TableHead>
                <TableHead className="text-right">Total Hrs</TableHead>
                <TableHead className="text-right">Ajuda Custo</TableHead>
                <TableHead className="text-right">Total a Pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compLancs.map((l) => {
                const prof = profs.find((p) => p.id === l.professorId);
                const seg = segmentos.find((s) => s.id === l.segmentoId);
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{prof?.nome}</TableCell>
                    <TableCell><Badge variant="secondary">{seg?.nome}</Badge></TableCell>
                    <TableCell className="text-right">{l.horasMensais}h</TableCell>
                    <TableCell className="text-right">{l.repouso}h</TableCell>
                    <TableCell className="text-right">{l.horasAtividade}h</TableCell>
                    <TableCell className="text-right font-medium">{l.totalHoras}h</TableCell>
                    <TableCell className="text-right">{formatCurrency(l.ajudaCusto)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(l.totalPagar)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totais mensais por professor */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Totais por Professor (Mensal)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead className="text-right">Total Horas</TableHead>
                <TableHead className="text-right">Total a Pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {totaisPorProfessor.map((r) => (
                <TableRow key={r.nome}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-right">{r.totalHoras.toFixed(2)}h</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(r.totalPagar)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell className="text-right">TOTAL</TableCell>
                <TableCell className="text-right">
                  {totaisPorProfessor.reduce((s, r) => s + r.totalHoras, 0).toFixed(2)}h
                </TableCell>
                <TableCell className="text-right text-lg">
                  {formatCurrency(totaisPorProfessor.reduce((s, r) => s + r.totalPagar, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
