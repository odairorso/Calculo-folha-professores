import { Professor } from './types';
import { useSyncExternalStore } from 'react';

type Subscriber = () => void;

let professoresStore: Professor[] = [];
const subscribers = new Set<Subscriber>();

export function listProfessores(): Professor[] {
  return professoresStore;
}

export async function initProfessoresFromApi() {
  try {
    const r = await fetch('/api/professores');
    if (r.ok) {
      const data = await r.json();
      // PostgreSQL NUMERIC retorna strings — converter para numbers
      professoresStore = data.map((p: any) => ({
        ...p,
        horasSemanais: p.horasSemanais != null ? Number(p.horasSemanais) : undefined,
        valorHora: p.valorHora != null ? Number(p.valorHora) : undefined,
        ajudaCusto: p.ajudaCusto != null ? Number(p.ajudaCusto) : undefined,
        ativo: typeof p.ativo === 'boolean' ? p.ativo : p.ativo === true || p.ativo === 'true',
      })) as Professor[];
      notify();
    }
  } catch {
    // API indisponível
  }
}

export async function addProfessor(p: Professor) {
  try {
    const body = {
      nome: p.nome,
      cpf: p.cpf,
      dataAdmissao: p.dataAdmissao,
      horasSemanais: p.horasSemanais,
      valorHora: p.valorHora ?? null,
      ajudaCusto: p.ajudaCusto ?? 0,
      segmentoId: p.segmentoIds?.[0],
    };
    const r = await fetch('/api/professores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const { id } = await r.json();
      professoresStore = [...professoresStore, { ...p, id }];
      notify();
      return;
    }
  } catch { }
  // fallback local
  professoresStore = [...professoresStore, p];
  notify();
}

export async function updateProfessor(id: string, patch: Partial<Professor>) {
  try {
    const body: any = { id };
    if (patch.nome != null) body.nome = patch.nome;
    if (patch.cpf != null) body.cpf = patch.cpf;
    if (patch.dataAdmissao != null) body.dataAdmissao = patch.dataAdmissao;
    if (patch.horasSemanais != null) body.horasSemanais = patch.horasSemanais;
    if (patch.valorHora != null) body.valorHora = patch.valorHora;
    if (patch.ajudaCusto != null) body.ajudaCusto = patch.ajudaCusto;
    if (patch.ativo != null) body.ativo = patch.ativo;
    if (patch.segmentoIds && patch.segmentoIds.length > 0) body.segmentoId = patch.segmentoIds[0];
    await fetch('/api/professores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch { }
  professoresStore = professoresStore.map((p) => (p.id === id ? { ...p, ...patch } : p));
  notify();
}

export async function deleteProfessor(id: string) {
  try {
    await fetch('/api/professores', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  } catch { }
  professoresStore = professoresStore.filter((p) => p.id !== id);
  notify();
}

export function toggleProfessorAtivo(id: string) {
  const p = professoresStore.find((x) => x.id === id);
  if (p) {
    updateProfessor(id, { ativo: !p.ativo });
  }
}

export function subscribe(cb: Subscriber) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function notify() {
  subscribers.forEach((cb) => cb());
}

export function useProfessores(): Professor[] {
  return useSyncExternalStore(subscribe, () => listProfessores());
}
