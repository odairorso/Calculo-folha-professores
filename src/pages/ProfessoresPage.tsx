import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { segmentos, formatCurrency } from '@/lib/mockData';
import { Professor } from '@/lib/types';
import { calcularHorasMensais } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, UserCheck, UserX, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { addProfessor as storeAdd, useProfessores, toggleProfessorAtivo, updateProfessor, deleteProfessor } from '@/lib/store';

export default function ProfessoresPage() {
  const profs = useProfessores();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [segId, setSegId] = useState('');
  const [horasSem, setHorasSem] = useState('');
  const [valorHora, setValorHora] = useState('');
  const [ajudaCusto, setAjudaCusto] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Professor | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editHorasSem, setEditHorasSem] = useState('');
  const [editValorHora, setEditValorHora] = useState('');
  const [editAjudaCusto, setEditAjudaCusto] = useState('');
  const [editSegId, setEditSegId] = useState('');

  const filtered = useMemo(
    () => profs.filter((p) => p.nome.toLowerCase().includes(search.toLowerCase())),
    [profs, search]
  );

  // Quando trocar o Ano na edição, preenche Valor/Hora e Ajuda de Custo somente se estiverem vazios
  useEffect(() => {
    if (!editOpen) return;
    const seg = segmentos.find((s) => s.id === editSegId);
    if (seg) {
      if (!editValorHora) setEditValorHora(String(seg.valorHora));
      if (!editAjudaCusto) setEditAjudaCusto(String(seg.ajudaCusto));
    }
  }, [editSegId, editOpen]);

  const addProfessor = () => {
    if (!nome || !cpf || !segId) return;
    const horasValue = parseFloat(horasSem);
    if (isNaN(horasValue) || horasValue <= 0) return;
    const valorHoraValue = parseFloat(valorHora);
    const ajudaCustoValue = parseFloat(ajudaCusto);
    const newProf: Professor = {
      id: `p${Date.now()}`,
      nome,
      cpf,
      dataAdmissao: new Date().toISOString().split('T')[0],
      horasSemanais: horasValue,
      segmentoIds: [segId],
      ativo: true,
      ...(isNaN(valorHoraValue) ? {} : { valorHora: valorHoraValue }),
      ...(isNaN(ajudaCustoValue) ? {} : { ajudaCusto: ajudaCustoValue }),
    };
    storeAdd(newProf);
    setNome('');
    setCpf('');
    setSegId('');
    setHorasSem('');
    setValorHora('');
    setAjudaCusto('');
    setDialogOpen(false);
  };

  const toggleAtivo = (id: string) => {
    toggleProfessorAtivo(id);
  };

  const openEdit = (p: Professor) => {
    setEditing(p);
    setEditNome(p.nome);
    setEditCpf(p.cpf);
    setEditHorasSem(p.horasSemanais ? String(p.horasSemanais) : '');
    // Prefill inicial baseado no primeiro Ano do professor
    const initialSegId = p.segmentoIds?.[0] ?? '';
    const seg = segmentos.find(s => s.id === initialSegId);
    setEditValorHora(p.valorHora != null ? String(p.valorHora) : seg ? String(seg.valorHora) : '');
    setEditAjudaCusto(p.ajudaCusto != null ? String(p.ajudaCusto) : seg ? String(seg.ajudaCusto) : '');
    setEditSegId(initialSegId);
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editing) return;
    const patch: Partial<Professor> = {
      nome: editNome || editing.nome,
      cpf: editCpf || editing.cpf,
    };
    const horasValue = parseFloat(editHorasSem);
    if (!isNaN(horasValue) && horasValue > 0) patch.horasSemanais = horasValue;
    const valorHoraValue = parseFloat(editValorHora);
    if (!isNaN(valorHoraValue) && valorHoraValue >= 0) patch.valorHora = valorHoraValue;
    const ajudaCustoValue = parseFloat(editAjudaCusto);
    if (!isNaN(ajudaCustoValue) && ajudaCustoValue >= 0) patch.ajudaCusto = ajudaCustoValue;
    if (editSegId) patch.segmentoIds = [editSegId];
    updateProfessor(editing.id, patch);
    setEditOpen(false);
    setEditing(null);
  };

  const removeProfessor = (id: string) => {
    if (confirm('Excluir este professor?')) {
      deleteProfessor(id);
    }
  };

  // Prefill de valorHora e ajudaCusto a partir do segmento escolhido (Ano)
  useEffect(() => {
    const seg = segmentos.find(s => s.id === segId);
    if (seg) {
      setValorHora(String(seg.valorHora));
      setAjudaCusto(String(seg.ajudaCusto));
    }
  }, [segId]);

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
            <DialogContent>
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
                <div>
                  <Label>Ano</Label>
                  <Select value={segId} onValueChange={setSegId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
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
                    min="1"
                    step="0.5"
                    value={horasSem}
                    onChange={(e) => setHorasSem(e.target.value)}
                    placeholder="Ex.: 10"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Hrs Mensais (auto): {Number.isFinite(parseFloat(horasSem)) ? (parseFloat(horasSem) * 4.5).toFixed(1) : '-'}
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm rounded-md border p-3 bg-muted/30">
                  {(() => {
                    const seg = segmentos.find(s => s.id === segId);
                    const hs = parseFloat(horasSem);
                    const vh = parseFloat(valorHora);
                    const aj = parseFloat(ajudaCusto);
                    if (!seg || !Number.isFinite(hs)) return <div className="col-span-3 text-muted-foreground">Preencha Ano e Horas/Sem para ver o preview</div>;
                    const mensais = calcularHorasMensais(hs);
                    const baseMensalSeg = calcularHorasMensais(seg.horasSemanais);
                    const percHA = baseMensalSeg ? seg.horasAtividade / baseMensalSeg : 0;
                    const ha = mensais * percHA;
                    const repouso = (mensais + ha) * seg.percRepouso;
                    const totalHoras = mensais + repouso + ha;
                    const salario = totalHoras * (Number.isFinite(vh) ? vh : seg.valorHora) + (Number.isFinite(aj) ? aj : seg.ajudaCusto);
                    return (
                      <>
                        <div><span className="text-muted-foreground">Mensal:</span> {mensais.toFixed(1)}h</div>
                        <div><span className="text-muted-foreground">Repouso:</span> {repouso.toFixed(1)}h</div>
                        <div><span className="text-muted-foreground">H.A.:</span> {ha.toFixed(1)}h</div>
                        <div><span className="text-muted-foreground">Total Hrs:</span> {totalHoras.toFixed(1)}h</div>
                        <div><span className="text-muted-foreground">Ajuda Custo:</span> {formatCurrency(Number.isFinite(aj) ? aj : seg.ajudaCusto)}</div>
                        <div><span className="text-muted-foreground">Valor/Hora:</span> {formatCurrency(Number.isFinite(vh) ? vh : seg.valorHora)}</div>
                        <div className="col-span-3"><span className="text-muted-foreground">T. a Pagar:</span> <span className="font-medium">{formatCurrency(Number(salario.toFixed(2)))}</span></div>
                      </>
                    );
                  })()}
                </div>
                <div>
                  <Label>Valor Hora Aula (opcional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorHora}
                    onChange={(e) => setValorHora(e.target.value)}
                    placeholder="Ex.: 19.59"
                  />
                </div>
                <div>
                  <Label>Ajuda de Custo (opcional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ajudaCusto}
                    onChange={(e) => setAjudaCusto(e.target.value)}
                    placeholder="Ex.: 10.00"
                  />
                </div>
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Admissão</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Hrs/Sem</TableHead>
                <TableHead>Valor Hora</TableHead>
                <TableHead>Ajuda Custo</TableHead>
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
              {filtered.map((prof) => (
                <TableRow key={prof.id} className="animate-fade-in">
                  <TableCell className="font-medium">{prof.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{prof.cpf}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(prof.dataAdmissao).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const first = prof.segmentoIds[0];
                      const rest = prof.segmentoIds.length - 1;
                      return (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {segmentos.find((s) => s.id === first)?.nome}
                          </Badge>
                          {rest > 0 && <span className="text-xs text-muted-foreground">+{rest}</span>}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof prof.horasSemanais === 'number' ? `${prof.horasSemanais}h` : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof prof.valorHora === 'number' ? formatCurrency(prof.valorHora) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof prof.ajudaCusto === 'number' ? formatCurrency(prof.ajudaCusto) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof prof.horasSemanais === 'number'
                      ? (() => {
                          // Soma das horas mensais considerando todos os segmentos
                          const mensais = prof.segmentoIds.reduce((acc, sid) => {
                            const seg = segmentos.find(s => s.id === sid);
                            if (!seg) return acc;
                            return acc + calcularHorasMensais(prof.horasSemanais!);
                          }, 0);
                          return `${mensais.toFixed(1)}h`;
                        })()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof prof.horasSemanais === 'number'
                      ? (() => {
                          let repousoSum = 0;
                          prof.segmentoIds.forEach((sid) => {
                            const seg = segmentos.find(s => s.id === sid);
                            if (!seg) return;
                            const mensais = calcularHorasMensais(prof.horasSemanais!);
                            const baseMensalSeg = calcularHorasMensais(seg.horasSemanais);
                            const percHA = baseMensalSeg ? seg.horasAtividade / baseMensalSeg : 0;
                            const ha = mensais * percHA;
                            const repouso = (mensais + ha) * seg.percRepouso;
                            repousoSum += repouso;
                          });
                          return `${repousoSum.toFixed(1)}h`;
                        })()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof prof.horasSemanais === 'number'
                      ? (() => {
                          let haSum = 0;
                          prof.segmentoIds.forEach((sid) => {
                            const seg = segmentos.find(s => s.id === sid);
                            if (!seg) return;
                            const mensais = calcularHorasMensais(prof.horasSemanais!);
                            const baseMensalSeg = calcularHorasMensais(seg.horasSemanais);
                            const percHA = baseMensalSeg ? seg.horasAtividade / baseMensalSeg : 0;
                            const ha = mensais * percHA;
                            haSum += ha;
                          });
                          return `${haSum.toFixed(1)}h`;
                        })()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof prof.horasSemanais === 'number'
                      ? (() => {
                          let totalH = 0;
                          prof.segmentoIds.forEach((sid) => {
                            const seg = segmentos.find(s => s.id === sid);
                            if (!seg) return;
                            const mensais = calcularHorasMensais(prof.horasSemanais!);
                            const baseMensalSeg = calcularHorasMensais(seg.horasSemanais);
                            const percHA = baseMensalSeg ? seg.horasAtividade / baseMensalSeg : 0;
                            const ha = mensais * percHA;
                            const repouso = (mensais + ha) * seg.percRepouso;
                            totalH += mensais + ha + repouso;
                          });
                          return `${totalH.toFixed(1)}h`;
                        })()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium">
                    {typeof prof.horasSemanais === 'number'
                      ? (() => {
                          // Calcula Total a Pagar somando por segmento com overrides
                          let total = 0;
                          prof.segmentoIds.forEach((sid) => {
                            const seg = segmentos.find(s => s.id === sid);
                            if (!seg) return;
                            const mensais = calcularHorasMensais(prof.horasSemanais!);
                            const baseMensalSeg = calcularHorasMensais(seg.horasSemanais);
                            const percHA = baseMensalSeg ? seg.horasAtividade / baseMensalSeg : 0;
                            const ha = mensais * percHA;
                            const repouso = (mensais + ha) * seg.percRepouso;
                            const totalHoras = mensais + ha + repouso;
                            const valorH = typeof prof.valorHora === 'number' ? prof.valorHora : seg.valorHora;
                            const ajuda = typeof prof.ajudaCusto === 'number' ? prof.ajudaCusto : seg.ajudaCusto;
                            total += totalHoras * valorH + ajuda;
                          });
                          return formatCurrency(Number(total.toFixed(2)));
                        })()
                      : '-'}
                  </TableCell>
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
                            <>
                              <UserX className="w-4 h-4 mr-2" /> Inativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" /> Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
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
            <div>
              <Label>Ano</Label>
              <Select value={editSegId} onValueChange={setEditSegId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
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
                min="1"
                step="0.5"
                value={editHorasSem}
                onChange={(e) => setEditHorasSem(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Hrs Mensais (auto): {Number.isFinite(parseFloat(editHorasSem)) ? (parseFloat(editHorasSem) * 4.5).toFixed(1) : '-'}
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm rounded-md border p-3 bg-muted/30">
              {(() => {
                const seg = segmentos.find(s => s.id === editSegId);
                const hs = parseFloat(editHorasSem);
                const vh = parseFloat(editValorHora);
                const aj = parseFloat(editAjudaCusto);
                if (!seg || !Number.isFinite(hs)) return <div className="col-span-3 text-muted-foreground">Informe Ano e Horas/Sem para ver o preview</div>;
                const mensais = calcularHorasMensais(hs);
                const baseMensalSeg = calcularHorasMensais(seg.horasSemanais);
                const percHA = baseMensalSeg ? seg.horasAtividade / baseMensalSeg : 0;
                const ha = mensais * percHA;
                const repouso = (mensais + ha) * seg.percRepouso;
                const totalHoras = mensais + repouso + ha;
                const salario = totalHoras * (Number.isFinite(vh) ? vh : (editing?.valorHora ?? seg.valorHora)) + (Number.isFinite(aj) ? aj : (editing?.ajudaCusto ?? seg.ajudaCusto));
                return (
                  <>
                    <div><span className="text-muted-foreground">Mensal:</span> {mensais.toFixed(1)}h</div>
                    <div><span className="text-muted-foreground">Repouso:</span> {repouso.toFixed(1)}h</div>
                    <div><span className="text-muted-foreground">H.A.:</span> {ha.toFixed(1)}h</div>
                    <div><span className="text-muted-foreground">Total Hrs:</span> {totalHoras.toFixed(1)}h</div>
                    <div><span className="text-muted-foreground">Ajuda Custo:</span> {formatCurrency(Number.isFinite(aj) ? aj : (editing?.ajudaCusto ?? seg.ajudaCusto))}</div>
                    <div><span className="text-muted-foreground">Valor/Hora:</span> {formatCurrency(Number.isFinite(vh) ? vh : (editing?.valorHora ?? seg.valorHora))}</div>
                    <div className="col-span-3"><span className="text-muted-foreground">T. a Pagar:</span> <span className="font-medium">{formatCurrency(Number(salario.toFixed(2)))}</span></div>
                  </>
                );
              })()}
            </div>
            <div>
              <Label>Valor Hora Aula</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editValorHora}
                onChange={(e) => setEditValorHora(e.target.value)}
              />
            </div>
            <div>
              <Label>Ajuda de Custo</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editAjudaCusto}
                onChange={(e) => setEditAjudaCusto(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveEdit}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
