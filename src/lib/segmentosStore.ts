import { Segmento } from './types';
import { useSyncExternalStore } from 'react';

type Subscriber = () => void;

let segmentosStore: Segmento[] = [];
let loaded = false;
const subscribers = new Set<Subscriber>();

function notify() {
    subscribers.forEach((cb) => cb());
}

export function listSegmentos(): Segmento[] {
    return segmentosStore;
}

export async function initSegmentosFromApi() {
    if (loaded) return;
    try {
        const r = await fetch('/api/segmentos');
        if (r.ok) {
            const data = await r.json();
            // API traz haPercent; converte para horasAtividade para exibição
            segmentosStore = data.map((s: any) => {
                const hs = Number(s.horasSemanais) || 10;
                const mensais = hs * 4.5;
                const haPercent = Number(s.haPercent) || 0;
                const horasAtividade = Number((mensais * haPercent).toFixed(2));
                const percRepouso = Number(s.percRepouso) || 1 / 6;
                return {
                    id: s.id,
                    nome: s.nome,
                    horasSemanais: hs,
                    percRepouso,
                    horasAtividade,
                    valorHora: Number(s.valorHora) || 0,
                    ajudaCusto: Number(s.ajudaCusto) || 0,
                } as Segmento;
            });
            loaded = true;
            notify();
        }
    } catch {
        // API indisponível
    }
}

export function setSegmentos(segs: Segmento[]) {
    segmentosStore = segs;
    notify();
}

export function subscribe(cb: Subscriber) {
    subscribers.add(cb);
    return () => {
        subscribers.delete(cb);
    };
}

export function useSegmentos(): Segmento[] {
    return useSyncExternalStore(subscribe, () => listSegmentos());
}
