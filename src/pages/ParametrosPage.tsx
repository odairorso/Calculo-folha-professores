import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { segmentos as initialSegmentos, formatCurrency } from '@/lib/mockData';
import { Segmento } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil, Save } from 'lucide-react';

export default function ParametrosPage() {
  const [segs, setSegs] = useState<Segmento[]>(initialSegmentos);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Segmento>>({});

  // Carrega segmentos do backend (se disponível)
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/segmentos');
        if (r.ok) {
          const data = await r.json();
          // API traz haPercent; converte para horasAtividade para exibição
          const converted: Segmento[] = data.map((s: any) => {
            const mensais = (s.horasSemanais ?? 10) * 4.5;
            const horasAtividade = Number((mensais * (s.haPercent ?? 0)).toFixed(2));
            return { ...s, horasAtividade };
          });
          setSegs(converted);
        }
      } catch {
        // fallback: já está com initialSegmentos
      }
    };
    load();
  }, []);

  const startEdit = (seg: Segmento) => {
    setEditingId(seg.id);
    setEditValues({ ...seg });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    // Atualiza no backend, se disponível
    try {
      const current = segs.find(s => s.id === editingId)!;
      const horasSemanais = editValues.horasSemanais ?? current.horasSemanais;
      const mensais = horasSemanais * 4.5;
      const haHoras = editValues.horasAtividade ?? current.horasAtividade;
      const haPercent = mensais > 0 ? haHoras / mensais : 0;
      const body: any = {
        id: editingId,
        horasSemanais,
        valorHora: editValues.valorHora ?? current.valorHora,
        ajudaCusto: editValues.ajudaCusto ?? current.ajudaCusto,
        haPercent
      };
      const r = await fetch('/api/segmentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (r.ok) {
        const u = await r.json();
        const updated: Segmento = {
          id: u.id,
          nome: u.nome,
          horasSemanais: u.horasSemanais,
          valorHora: u.valorHora,
          ajudaCusto: u.ajudaCusto,
          // Converte haPercent recebido para horasAtividade para exibição
          horasAtividade: Number(((u.horasSemanais * 4.5) * (u.haPercent ?? haPercent)).toFixed(2)),
        };
        setSegs(segs.map((s) => (s.id === editingId ? updated : s)));
      } else {
        // Fallback local se API indisponível
        setSegs(segs.map((s) => (s.id === editingId ? { ...s, ...editValues } as Segmento : s)));
      }
    } catch {
      setSegs(segs.map((s) => (s.id === editingId ? { ...s, ...editValues } as Segmento : s)));
    } finally {
      setEditingId(null);
      setEditValues({});
    }
  };

  return (
    <div>
      <PageHeader
        title="Parâmetros de Cálculo"
        description="Configure valores por segmento de ensino"
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segmento</TableHead>
                <TableHead className="text-right">Hrs Semanais</TableHead>
                <TableHead className="text-right">% Repouso</TableHead>
                <TableHead className="text-right">H.A.</TableHead>
                <TableHead className="text-right">Valor/Hora</TableHead>
                <TableHead className="text-right">Ajuda de Custo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segs.map((seg) => (
                <TableRow key={seg.id}>
                  <TableCell className="font-medium">{seg.nome}</TableCell>
                  {editingId === seg.id ? (
                    <>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="w-20 ml-auto text-right"
                          value={editValues.horasSemanais ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, horasSemanais: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">1/6</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="w-20 ml-auto text-right"
                          value={editValues.horasAtividade ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, horasAtividade: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24 ml-auto text-right"
                          value={editValues.valorHora ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, valorHora: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24 ml-auto text-right"
                          value={editValues.ajudaCusto ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, ajudaCusto: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={saveEdit}>
                          <Save className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-right">{seg.horasSemanais}h</TableCell>
                      <TableCell className="text-right">1/6</TableCell>
                      <TableCell className="text-right">{seg.horasAtividade}h</TableCell>
                      <TableCell className="text-right">{formatCurrency(seg.valorHora)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(seg.ajudaCusto)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(seg)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Formula reference */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3">Fórmulas de Cálculo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">Horas Mensais</span>
              <span>= Hrs Semanais × 4,5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">Repouso</span>
              <span>= Hrs Mensais × 1/6</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">Total Horas</span>
              <span>= Mensais + Repouso + H.A.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">Total a Pagar</span>
              <span>= Total Hrs × Valor/Hora + Ajuda</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
