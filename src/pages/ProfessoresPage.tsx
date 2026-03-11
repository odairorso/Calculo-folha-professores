import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, UserX, UserCheck, X } from 'lucide-react';
import { Professor, calcularHorasMensais } from '@/lib/types';
import { useProfessores, addProfessor as storeAdd, updateProfessor, deleteProfessor, toggleProfessorAtivo, initProfessoresFromApi } from '@/lib/store';
import { useSegmentos, initSegmentosFromApi } from '@/lib/segmentosStore';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function toNumberBR(v: string): number {
  if (v == null || v === '') return NaN;
  return parseFloat(String(v).replace(',', '.'));
}

interface SegSlot {
  segId: string;
  horas: string;
}

export function ProfessoresPage() {
  const segmentos = useSegmentos();
  const profs = useProfessores();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [slots, setSlots] = useState<SegSlot[]>([{ segId: '', horas: '' }]);
  // Removido valor/ajuda globais: cálculo sempre por turma

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Professor | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editSlots, setEditSlots] = useState<SegSlot[]>([{ segId: '', horas: '' }]);
  // Removido valor/ajuda globais na edição

  useEffect(() => {
    initProfessoresFromApi();
    initSegmentosFromApi();
  }, []);

  const filtered = useMemo(
    () => profs.filter((p) => p.nome.toLowerCase().includes(search.toLowerCase())),
    [profs, search]
  );

  // Sem prefill global na edição; cálculo sempre por turma

  const addProfessor = () => {
    const validSlots = slots.filter(s => s.segId && parseFloat(s.horas) > 0);
    if (!nome || !cpf || validSlots.length === 0) return;

    const segmentoHoras: Record<string, number> = {};
    const segmentoIds: string[] = [];
    validSlots.forEach(s => {
      if (!segmentoIds.includes(s.segId)) {
        segmentoIds.push(s.segId);
        segmentoHoras[s.segId] = parseFloat(s.horas);
      } else {
        segmentoHoras[s.segId] += parseFloat(s.horas);
      }
    });

    const newProf: Professor = {
      id: `p${Date.now()}`,
      nome,
      cpf,
      dataAdmissao: new Date().toISOString().split('T')[0],
      segmentoIds,
      segmentoHoras,
      ativo: true,
      // Sem valor/ajuda globais
    };
    storeAdd(newProf);
    setNome('');
    setCpf('');
    setSlots([{ segId: '', horas: '' }]);
    setDialogOpen(false);
  };

  const toggleAtivo = (id: string) => {
    toggleProfessorAtivo(id);
  };

  const openEdit = (p: Professor) => {
    setEditing(p);
    setEditNome(p.nome);
    setEditCpf(p.cpf);

    const newSlots: SegSlot[] = [{ segId: '', horas: '' }];
    if (p.segmentoIds) {
      p.segmentoIds.forEach((sid, index) => {
        const h = p.segmentoHoras?.[sid] || p.horasSemanais || 0;
        if (index === 0) newSlots[0] = { segId: sid, horas: h ? String(h) : '' };
        else newSlots.push({ segId: sid, horas: h ? String(h) : '' });
      });
    }
    setEditSlots(newSlots);

    const initialSegId = p.segmentoIds?.[0] ?? '';
    const seg = segmentos.find(s => s.id === initialSegId);
    // Sem campos globais na edição
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editing) return;
    const patch: Partial<Professor> = {
      nome: editNome || editing.nome,
      cpf: editCpf || editing.cpf,
    };

    const validSlots = editSlots.filter(s => s.segId && parseFloat(s.horas) > 0);
    if (validSlots.length > 0) {
      const segmentoHoras: Record<string, number> = {};
      const segmentoIds: string[] = [];
      validSlots.forEach(s => {
        if (!segmentoIds.includes(s.segId)) {
          segmentoIds.push(s.segId);
          segmentoHoras[s.segId] = parseFloat(s.horas);
        } else {
          segmentoHoras[s.segId] += parseFloat(s.horas);
        }
      });
      patch.segmentoIds = segmentoIds;
      patch.segmentoHoras = segmentoHoras;
      patch.horasSemanais = undefined; // Limpar legado
    }

    // Não atualiza valor/ajuda globais via edição

    updateProfessor(editing.id, patch);
    setEditOpen(false);
    setEditing(null);
  };

  const removeProfessor = (id: string) => {
    if (confirm('Excluir este professor?')) {
      deleteProfessor(id);
    }
  };

  // Removido prefill global no cadastro

  const addSlotRow = (setFunc: (val: SegSlot[]) => void, current: SegSlot[]) => {
    setFunc([...current, { segId: '', horas: '' }]);
  };

  const removeSlotRow = (setFunc: (val: SegSlot[]) => void, current: SegSlot[], idx: number) => {
    const next = current.filter((_, i) => i !== idx);
    setFunc(next.length ? next : [{ segId: '', horas: '' }]);
  };

  const renderSlots = (currentSlots: SegSlot[], setFunc: (val: SegSlot[]) => void) => {
    return (
      <div className="space-y-4 mt-2 border-y py-4 my-4">
        <Label className="text-muted-foreground font-semibold">Turmas do Professor</Label>
        {currentSlots.map((slot, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ano {i + 1}</Label>
              {currentSlots.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSlotRow(setFunc, currentSlots, i)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div>
              <Select
                value={slot.segId || "none"}
                onValueChange={(val) => {
                  const newS = [...currentSlots];
                  newS[i].segId = val === "none" ? "" : val;
                  setFunc(newS);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione (Nenhum)</SelectItem>
                  {segmentos.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horas por Semana</Label>
              <Input
                type="number"
                placeholder="Ex.: 10"
                min="0.5"
                step="0.5"
                value={slot.horas}
                onChange={(e) => {
                  const newS = [...currentSlots];
                  newS[i].horas = e.target.value;
                  setFunc(newS);
                }}
                disabled={!slot.segId}
              />
            </div>
          </div>
        ))}
        <div>
          <Button type="button" variant="secondary" onClick={() => addSlotRow(setFunc, currentSlots)}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar turma
          </Button>
        </div>
      </div>
    );
  };

  const renderPreview = (currentSlots: SegSlot[], _vHora: string, _aCusto: string, isEditingParams?: Professor) => {
    const valid = currentSlots.filter(s => s.segId && parseFloat(s.horas) > 0);
    if (valid.length === 0) return <div className="text-muted-foreground">Selecione ao menos 1 turma com horas para ver o preview</div>;

    let tMensais = 0, tRepouso = 0, tHA = 0, tHoras = 0, salario = 0;
    // Força cálculo por turma (ignora valor/ajuda globais)
    const vh = NaN;
    const aj = NaN;
    const perTurma: string[] = [];

    valid.forEach(s => {
      const seg = segmentos.find(x => x.id === s.segId);
      if (!seg) return;
      const hs = toNumberBR(s.horas);
      const mensais = calcularHorasMensais(hs);
      const baseMensalSeg = calcularHorasMensais(Number(seg.horasSemanais) || 0);
      const percHA = baseMensalSeg ? (Number(seg.horasAtividade) || 0) / baseMensalSeg : 0;
      const ha = mensais * percHA;
      const repouso = (mensais + ha) * (Number(seg.percRepouso) || 1 / 6);
      const tt = mensais + ha + repouso;

      tMensais += mensais;
      tRepouso += repouso;
      tHA += ha;
      tHoras += tt;

      const valorFinal = Number.isFinite(vh) ? vh : (isEditingParams?.valorHora ?? seg.valorHora);
      const ajudaFinal = Number.isFinite(aj) ? aj : (isEditingParams?.ajudaCusto ?? seg.ajudaCusto);
      salario += (tt * valorFinal) + ajudaFinal;
      perTurma.push(`${seg.nome}: ${formatCurrency(valorFinal)}`);
    });

    return (
      <div className="grid grid-cols-3 gap-3 text-sm rounded-md border p-3 bg-muted/30 mt-2">
        <div><span className="text-muted-foreground">Mensal:</span> {tMensais.toFixed(1)}h</div>
        <div><span className="text-muted-foreground">Repouso:</span> {tRepouso.toFixed(1)}h</div>
        <div><span className="text-muted-foreground">H.A.:</span> {tHA.toFixed(1)}h</div>
        <div><span className="text-muted-foreground">Total Hrs:</span> {tHoras.toFixed(1)}h</div>
        <div><span className="text-muted-foreground">A. Custo:</span> {formatCurrency(Number.isFinite(aj) ? aj : 0)}</div>
        <div className="col-span-3">
          <span className="text-muted-foreground">Vr/Hora por turma:</span>
          <div className="mt-1 grid grid-cols-1 gap-1">
            {perTurma.map((t, i) => (
              <div key={i} className="text-xs whitespace-normal break-words">{t}</div>
            ))}
          </div>
        </div>
        <div className="col-span-3 pt-2 mt-1 border-t border-border/50 text-base">
          <span className="text-muted-foreground">T. a Pagar:</span> <span className="font-semibold text-primary ml-2">{formatCurrency(salario)}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Professores"
        description="Cadastro e gestão de professores"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo Professor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Professor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do professor" />
                </div>
                <div>
                  <Label>CPF</Label>
                  <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
                </div>

                {renderSlots(slots, setSlots)}
                {renderPreview(slots, '', '')}

                {/* Removidos campos globais */}
                <Button onClick={addProfessor} className="w-full">Cadastrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar professor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Turmas (Hrs)</TableHead>
                <TableHead>Mensal</TableHead>
                <TableHead>Repouso</TableHead>
                <TableHead>H.A.</TableHead>
                <TableHead>Total Hrs</TableHead>
                <TableHead>T. a Pagar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((prof) => {
                let sMensais = 0, sRepouso = 0, sHA = 0, sTotalHoras = 0, sPagar = 0;

                prof.segmentoIds.forEach(sid => {
                  const seg = segmentos.find(s => s.id === sid);
                  if (!seg) return;
                  const hs = prof.segmentoHoras?.[sid] || prof.horasSemanais || 0;
                  const mensais = calcularHorasMensais(hs);
                  const baseMensalSeg = calcularHorasMensais(Number(seg.horasSemanais) || 0);
                  const percHA = baseMensalSeg ? (Number(seg.horasAtividade) || 0) / baseMensalSeg : 0;
                  const ha = mensais * percHA;
                  const repouso = (mensais + ha) * (Number(seg.percRepouso) || 1 / 6);
                  const tt = mensais + ha + repouso;
                  sMensais += mensais;
                  sRepouso += repouso;
                  sHA += ha;
                  sTotalHoras += tt;
                  const valorH = typeof prof.valorHora === 'number' ? prof.valorHora : seg.valorHora;
                  const ajuda = typeof prof.ajudaCusto === 'number' ? prof.ajudaCusto : seg.ajudaCusto;
                  sPagar += (tt * valorH) + ajuda;
                });

                return (
                  <TableRow key={prof.id} className="animate-fade-in whitespace-nowrap">
                    <TableCell className="font-medium">{prof.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{prof.cpf}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {prof.segmentoIds.map(sid => {
                          const seg = segmentos.find(s => s.id === sid);
                          const hs = prof.segmentoHoras?.[sid] || prof.horasSemanais || 0;
                          return (
                            <Badge key={sid} variant="secondary" className="text-[10px] fit-content">
                              {seg?.nome || '?'} ({hs}h)
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sMensais.toFixed(1)}h</TableCell>
                    <TableCell className="text-muted-foreground">{sRepouso.toFixed(1)}h</TableCell>
                    <TableCell className="text-muted-foreground">{sHA.toFixed(1)}h</TableCell>
                    <TableCell className="text-muted-foreground">{sTotalHoras.toFixed(1)}h</TableCell>
                    <TableCell className="font-medium">{formatCurrency(sPagar)}</TableCell>
                    <TableCell>
                      <Badge variant={prof.ativo ? 'default' : 'destructive'}>
                        {prof.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" aria-label="Ações">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(prof)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => removeProfessor(prof.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleAtivo(prof.id)}>
                            {prof.ativo ? (
                              <><UserX className="w-4 h-4 mr-2" /> Inativar</>
                            ) : (
                              <><UserCheck className="w-4 h-4 mr-2" /> Ativar</>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Professor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nome Completo</Label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={editCpf} onChange={(e) => setEditCpf(e.target.value)} />
            </div>

            {renderSlots(editSlots, setEditSlots)}
            {renderPreview(editSlots, '', '', editing!)}

            {/* Removidos campos globais na edição */}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveEdit}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
