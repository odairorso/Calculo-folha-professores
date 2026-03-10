import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatCompetencia } from '@/lib/mockData';
import { useSegmentos, initSegmentosFromApi } from '@/lib/segmentosStore';
import { Lancamento, gerarLancamento } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { useProfessores } from '@/lib/store';

export default function LancamentosPage() {
  const profs = useProfessores();
  const segmentos = useSegmentos();
  const [lancs, setLancs] = useState<Lancamento[]>([]);
  const [compFilter, setCompFilter] = useState('2026-03');

  useEffect(() => {
    initSegmentosFromApi();
  }, []);

  const filtered = useMemo(() => lancs.filter((l) => l.competencia === compFilter), [lancs, compFilter]);
  const totalGeral = filtered.reduce((s, l) => s + l.totalPagar, 0);

  const recalcular = () => {
    const newLancs: Lancamento[] = [];
    profs.filter(p => p.ativo).forEach((prof) => {
      prof.segmentoIds.forEach((segId) => {
        const seg = segmentos.find((s) => s.id === segId)!;
        const lanc = gerarLancamento(prof, seg, compFilter);
        newLancs.push({ ...lanc, id: `l-${prof.id}-${segId}-${compFilter}` });
      });
    });
    setLancs((prev) => {
      const other = prev.filter((l) => l.competencia !== compFilter);
      return [...other, ...newLancs];
    });
  };

  useEffect(() => {
    recalcular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profs, compFilter]);

  return (
    <div>
      <PageHeader
        title="Lançamento de Horas"
        description="Cálculo automático por competência (layout tipo planilha)"
        actions={
          <div className="flex items-center gap-3">
            <Select value={compFilter} onValueChange={setCompFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-01">Jan/2026</SelectItem>
                <SelectItem value="2026-02">Fev/2026</SelectItem>
                <SelectItem value="2026-03">Mar/2026</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={recalcular} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />Recalcular
            </Button>
          </div>
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
                const prof = profs.find((p) => p.id === lanc.professorId);
                const seg = segmentos.find((s) => s.id === lanc.segmentoId);
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
