import { Professor } from './types';
import { useSyncExternalStore } from 'react';
import { professores as seedProfessores } from './mockData';

type Subscriber = () => void;

let professoresStore: Professor[] = [...seedProfessores];
const subscribers = new Set<Subscriber>();

export function listProfessores(): Professor[] {
  return professoresStore;
}

export function addProfessor(p: Professor) {
  professoresStore = [...professoresStore, p];
  notify();
}

export function updateProfessor(id: string, patch: Partial<Professor>) {
  professoresStore = professoresStore.map((p) => (p.id === id ? { ...p, ...patch } : p));
  notify();
}

export function deleteProfessor(id: string) {
  professoresStore = professoresStore.filter((p) => p.id !== id);
  notify();
}

export function toggleProfessorAtivo(id: string) {
  professoresStore = professoresStore.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p));
  notify();
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
