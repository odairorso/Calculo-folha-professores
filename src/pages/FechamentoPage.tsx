import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { lancamentos, professores, segmentos, fechamentos as initialFechamentos, formatCurrency, formatCompetencia } from '@/lib/mockData';
import { Fechamento, Lancamento } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function FechamentoPage() {
  const [fechs, setFechs] = useState<Fechamento[]>(initialFechamentos);
  const [comp, setComp] = useState('2026-03');
  const [obs, setObs] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const compLancs = lancamentos.filter((l) => l.competencia === comp);
  const totalGeral = compLancs.reduce((s, l) => s + l.totalPagar, 0);
  const isFechado = fechs.some((f) => f.competencia === comp);

  const fecharCompetencia = () => {
    const newFech: Fechamento = {
      id: `f-${comp}`,
      competencia: comp,
      dataFechamento: new Date().toISOString().split('T')[0],
      observacao: obs,
      totalGeral,
    };
    setFechs([...fechs, newFech]);
    setObs('');
    setDialogOpen(false);
    toast.success(`Competência ${formatCompetencia(comp)} fechada com sucesso!`);
  };

  return (
    <div>
      <PageHeader
        title="Fechamento Mensal"
        description="Consolide e feche a competência"
        actions={
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
        }
      />

      {/* Status */}
      <Card className={`mb-6 ${isFechado ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
        <CardContent className="flex items-center gap-3 py-4">
          {isFechado ? (
            <>
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="font-medium">Competência fechada em {fechs.find(f => f.competencia === comp)?.dataFechamento}</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="font-medium">Competência aberta — aguardando fechamento</span>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Prévia — {formatCompetencia(comp)}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead className="text-right">Total Horas</TableHead>
                <TableHead className="text-right">Total a Pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compLancs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{professores.find(p => p.id === l.professorId)?.nome}</TableCell>
                  <TableCell><Badge variant="secondary">{segmentos.find(s => s.id === l.segmentoId)?.nome}</Badge></TableCell>
                  <TableCell className="text-right">{l.totalHoras}h</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(l.totalPagar)}</TableCell>
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

      {!isFechado && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Fechar Competência {formatCompetencia(comp)}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Fechamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Após o fechamento, os lançamentos serão bloqueados para edição. Total: <strong>{formatCurrency(totalGeral)}</strong>
              </p>
              <div>
                <Textarea
                  placeholder="Observações (opcional)"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
              </div>
              <Button onClick={fecharCompetencia} className="w-full">
                Confirmar Fechamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* History */}
      {fechs.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Histórico de Fechamentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Data Fechamento</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fechs.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{formatCompetencia(f.competencia)}</TableCell>
                    <TableCell>{new Date(f.dataFechamento).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-muted-foreground">{f.observacao || '—'}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(f.totalGeral)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
