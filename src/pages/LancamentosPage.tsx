import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatCompetencia, gerarMesesDisponiveis, competenciaAtual } from '@/lib/mockData';
import { useSegmentos, initSegmentosFromApi } from '@/lib/segmentosStore';
import { Lancamento, gerarLancamento } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfessores } from '@/lib/store';

const MESES = gerarMesesDisponiveis(12);

export default function LancamentosPage() {
  const profs = useProfessores();
  const segmentos = useSegmentos();
  const [compFilter, setCompFilter] = useState(competenciaAtual);

  useEffect(() => {
    initSegmentosFromApi();
  }, []);

  // Maps para lookup O(1) em vez de .find() a cada linha renderizada
  const profMap = useMemo(() => new Map(profs.map(p => [p.id, p])), [profs]);
  const segMap = useMemo(() => new Map(segmentos.map(s => [s.id, s])), [segmentos]);

  // Cálculo reativo: recalcula apenas quando profs, segmentos ou competência mudam
  const filtered = useMemo((): (Lancamento & { id: string })[] => {
    const list: (Lancamento & { id: string })[] = [];
    profs.filter(p => p.ativo).forEach(prof => {
      prof.segmentoIds.forEach(segId => {
        const seg = segMap.get(segId);
        if (!seg) return;
        const l = gerarLancamento(prof, seg, compFilter);
        list.push({ ...l, id: `l-${prof.id}-${segId}-${compFilter}` });
      });
    });
    return list;
  }, [profs, segmentos, compFilter, segMap]);

  const totalGeral = useMemo(() => filtered.reduce((s, l) => s + l.totalPagar, 0), [filtered]);

  return (
    <div>
      <PageHeader
        title="Lançamento de Horas"
        description="Cálculo automático por competência (layout tipo planilha)"
        actions={
          <Select value={compFilter} onValueChange={setCompFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead className="text-right">Horas S.</TableHead>
                <TableHead className="text-right">Mensal</TableHead>
                <TableHead className="text-right">Repouso</TableHead>
                <TableHead className="text-right">H.A.</TableHead>
                <TableHead className="text-right">Total de Hrs Mensal</TableHead>
                <TableHead className="text-right">Ajuda custo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">T. a Pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lanc) => {
                const prof = profMap.get(lanc.professorId);
                const seg = segMap.get(lanc.segmentoId);
                const horasSemanais = (prof?.horasSemanais ?? seg?.horasSemanais) ?? 0;
                const valorHora = (prof?.valorHora ?? seg?.valorHora) ?? 0;
                return (
                  <TableRow key={lanc.id} className="animate-fade-in">
                    <TableCell className="font-medium">{prof?.nome}</TableCell>
                    <TableCell><Badge variant="secondary">{seg?.nome}</Badge></TableCell>
                    <TableCell className="text-right">{horasSemanais.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{lanc.horasMensais.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{lanc.repouso.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{lanc.horasAtividade.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-medium">{lanc.totalHoras.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(lanc.ajudaCusto)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(valorHora)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(lanc.totalPagar)}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={9} className="text-right">TOTAL</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalGeral)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum lançamento para esta competência
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
