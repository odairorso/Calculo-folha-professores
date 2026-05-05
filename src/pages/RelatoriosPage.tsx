import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatCompetencia, gerarMesesDisponiveis, competenciaAtual } from '@/lib/mockData';
import { useSegmentos, initSegmentosFromApi } from '@/lib/segmentosStore';
import { gerarLancamento, Lancamento } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfessores } from '@/lib/store';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MESES = gerarMesesDisponiveis(12);
const TODOS_PROFESSORES = '__all__';

export default function RelatoriosPage() {
  const profs = useProfessores();
  const segmentos = useSegmentos();
  const [comp, setComp] = useState(competenciaAtual);
  const [professorId, setProfessorId] = useState<string>(TODOS_PROFESSORES);

  useEffect(() => {
    initSegmentosFromApi();
  }, []);

  // Maps para lookup O(1) em vez de .find() a cada linha renderizada
  const profMap = useMemo(() => new Map(profs.map(p => [p.id, p])), [profs]);
  const segMap = useMemo(() => new Map(segmentos.map(s => [s.id, s])), [segmentos]);

  // Cálculo reativo: deps corretas (inclui segmentos)
  const compLancs = useMemo((): (Lancamento & { id: string })[] => {
    const list: (Lancamento & { id: string })[] = [];
    profs.filter(p => p.ativo).forEach(p => {
      p.segmentoIds.forEach(segId => {
        const seg = segMap.get(segId);
        if (!seg) return;
        const l = gerarLancamento(p, seg, comp);
        list.push({ ...l, id: `l-${p.id}-${segId}-${comp}` });
      });
    });
    return list;
  }, [profs, comp, segMap]);

  const lancsFiltrados = useMemo(() => {
    if (professorId === TODOS_PROFESSORES) return compLancs;
    return compLancs.filter((l) => l.professorId === professorId);
  }, [compLancs, professorId]);

  const professorSelecionado = useMemo(() => {
    if (professorId === TODOS_PROFESSORES) return null;
    return profMap.get(professorId) ?? null;
  }, [professorId, profMap]);

  const segData = useMemo(() => {
    return segmentos.map((seg) => {
      const segLancs = lancsFiltrados.filter((l) => l.segmentoId === seg.id);
      return {
        segmento: seg.nome,
        professores: segLancs.length,
        totalHoras: segLancs.reduce((s, l) => s + l.totalHoras, 0),
        totalPagar: segLancs.reduce((s, l) => s + l.totalPagar, 0),
      };
    }).filter((s) => s.professores > 0);
  }, [lancsFiltrados, segmentos]);

  const totalGeral = useMemo(() => lancsFiltrados.reduce((s, l) => s + l.totalPagar, 0), [lancsFiltrados]);

  const totaisPorProfessor = useMemo(() => {
    const map = new Map<string, { nome: string; totalHoras: number; totalPagar: number }>();
    lancsFiltrados.forEach((l) => {
      const nome = profMap.get(l.professorId)?.nome ?? l.professorId;
      const cur = map.get(l.professorId) ?? { nome, totalHoras: 0, totalPagar: 0 };
      cur.totalHoras += l.totalHoras;
      cur.totalPagar += l.totalPagar;
      map.set(l.professorId, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [lancsFiltrados, profMap]);

  const exportCSV = () => {
    const header1 = 'Professor,Segmento,Hrs Mensais,Repouso,H.A.,Total Hrs,Ajuda Custo,Total Pagar\n';
    const rows1 = lancsFiltrados.map((l) => {
      const prof = profMap.get(l.professorId);
      const seg = segMap.get(l.segmentoId);
      return `${prof?.nome},${seg?.nome},${l.horasMensais},${l.repouso},${l.horasAtividade},${l.totalHoras},${l.ajudaCusto},${l.totalPagar}`;
    }).join('\n');
    const header2 = '\n\nTotais por Professor\nProfessor,Total Horas,Total a Pagar\n';
    const rows2 = totaisPorProfessor.map((r) => `${r.nome},${r.totalHoras.toFixed(2)},${r.totalPagar.toFixed(2)}`).join('\n');
    const blob = new Blob([header1 + rows1 + header2 + rows2], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${comp}${professorSelecionado ? `-${professorSelecionado.nome}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const title = `Relatório — ${formatCompetencia(comp)}${professorSelecionado ? ` — ${professorSelecionado.nome}` : ''}`;
    const sanitize = (name: string) => {
      return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '')
        .toLowerCase();
    };

    const dataGeracao = new Date().toLocaleString('pt-BR');
    const doc = new jsPDF({
      orientation: professorSelecionado ? 'portrait' : 'landscape',
      unit: 'pt',
      format: 'a4',
    });
    const pageWidth = doc.internal.pageSize.getWidth();

    const didDrawPage = (data: { pageNumber: number }) => {
      doc.setFontSize(12);
      doc.text('Cálculo Salário Professores', 40, 28);
      doc.setFontSize(10);
      doc.text(title, 40, 46);
      doc.text(`Gerado em: ${dataGeracao}`, pageWidth - 40, 28, { align: 'right' });
      doc.text(`Página ${data.pageNumber}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 18, { align: 'right' });
    };

    const commonTable = {
      theme: 'grid' as const,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [30, 50, 80] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 70, left: 40, right: 40, bottom: 30 },
      didDrawPage,
    };

    if (professorSelecionado) {
      const totalHoras = lancsFiltrados.reduce((s, l) => s + l.totalHoras, 0);
      const totalPagar = lancsFiltrados.reduce((s, l) => s + l.totalPagar, 0);

      doc.setFontSize(10);
      doc.text(`Professor: ${professorSelecionado.nome}`, 40, 64);
      doc.text(`CPF: ${professorSelecionado.cpf}`, 40, 80);
      doc.text(`Admissão: ${professorSelecionado.dataAdmissao}`, 40, 96);
      doc.text(`Total do mês: ${formatCurrency(totalPagar)} (${totalHoras.toFixed(2)}h)`, 40, 112);

      autoTable(doc, {
        ...commonTable,
        startY: 130,
        head: [['Segmento', 'Valor Hora', 'Hrs Mensais', 'Repouso', 'H.A.', 'Total Hrs', 'Ajuda Custo', 'Total a Pagar']],
        body: lancsFiltrados.map((l) => {
          const seg = segMap.get(l.segmentoId);
          return [
            seg?.nome ?? '',
            seg ? formatCurrency(seg.valorHora) : '',
            `${l.horasMensais}h`,
            `${l.repouso}h`,
            `${l.horasAtividade}h`,
            `${l.totalHoras}h`,
            formatCurrency(l.ajudaCusto),
            formatCurrency(l.totalPagar),
          ];
        }),
        foot: [[
          'TOTAL',
          '',
          '',
          '',
          '',
          `${totalHoras.toFixed(2)}h`,
          '',
          formatCurrency(totalPagar),
        ]],
        footStyles: { fillColor: [230, 233, 238], textColor: 20, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 150 },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
        },
      });
    } else {
      doc.setFontSize(10);
      doc.text(`Total geral: ${formatCurrency(totalGeral)}`, 40, 64);

      autoTable(doc, {
        ...commonTable,
        startY: 80,
        head: [['Consolidado por Segmento', 'Professores', 'Total Horas', 'Total a Pagar']],
        body: segData.map((s) => [s.segmento, String(s.professores), `${s.totalHoras.toFixed(2)}h`, formatCurrency(s.totalPagar)]),
        foot: [['TOTAL', '', '', formatCurrency(totalGeral)]],
        footStyles: { fillColor: [230, 233, 238], textColor: 20, fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      });

      const y1 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80;
      autoTable(doc, {
        ...commonTable,
        startY: y1 + 18,
        head: [['Totais por Professor (Mensal)', 'Total Horas', 'Total a Pagar']],
        body: totaisPorProfessor.map((r) => [r.nome, `${r.totalHoras.toFixed(2)}h`, formatCurrency(r.totalPagar)]),
        foot: [[
          'TOTAL',
          `${totaisPorProfessor.reduce((s, r) => s + r.totalHoras, 0).toFixed(2)}h`,
          formatCurrency(totaisPorProfessor.reduce((s, r) => s + r.totalPagar, 0)),
        ]],
        footStyles: { fillColor: [230, 233, 238], textColor: 20, fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      });

      const y2 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y1 + 18;
      autoTable(doc, {
        ...commonTable,
        startY: y2 + 18,
        styles: { fontSize: 8, cellPadding: 3 },
        head: [['Detalhamento', 'Segmento', 'Hrs Mensais', 'Repouso', 'H.A.', 'Total Hrs', 'Ajuda Custo', 'Total a Pagar']],
        body: lancsFiltrados.map((l) => {
          const p = profMap.get(l.professorId);
          const seg = segMap.get(l.segmentoId);
          return [
            p?.nome ?? '',
            seg?.nome ?? '',
            `${l.horasMensais}h`,
            `${l.repouso}h`,
            `${l.horasAtividade}h`,
            `${l.totalHoras}h`,
            formatCurrency(l.ajudaCusto),
            formatCurrency(l.totalPagar),
          ];
        }),
        columnStyles: {
          0: { cellWidth: 150 },
          1: { cellWidth: 120 },
        },
      });
    }

    const fileName = `relatorio-${comp}${professorSelecionado ? `-${sanitize(professorSelecionado.nome)}` : ''}.pdf`;
    doc.save(fileName);
  };

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description={`Relatório consolidado — ${formatCompetencia(comp)}${professorSelecionado ? ` — ${professorSelecionado.nome}` : ''}`}
        actions={
          <div className="flex items-center gap-3">
            <Select value={professorId} onValueChange={setProfessorId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS_PROFESSORES}>Todos os professores</SelectItem>
                {profs.filter((p) => p.ativo).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={comp} onValueChange={setComp}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
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
              {lancsFiltrados.map((l) => {
                const prof = profMap.get(l.professorId);
                const seg = segMap.get(l.segmentoId);
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
