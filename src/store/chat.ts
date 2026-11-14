import { create } from 'zustand';
import type { BotLink } from '../lib/assistant';

export interface ChatMsg {
  id: number;
  role: 'user' | 'bot';
  text: string;
  products?: string[];
  links?: BotLink[];
  chips?: string[];
}

interface ChatState {
  open: boolean;
  typing: boolean;
  msgs: ChatMsg[];
  /** Artikel, auf den sich Folgefragen beziehen */
  last?: string;
  setOpen: (open: boolean) => void;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

let seq = 0;

/** Chatverlauf bleibt beim Seitenwechsel erhalten, wird aber bewusst nicht gespeichert (Datenschutz). */
export const useChat = create<ChatState>((set, get) => ({
  open: false,
  typing: false,
  msgs: [],
  setOpen: (open) => set({ open }),
  reset: () => set({ msgs: [], last: undefined, typing: false }),
  send: async (text) => {
    const t = text.trim();
    if (!t || get().typing) return;
    set((s) => ({ msgs: [...s.msgs, { id: ++seq, role: 'user', text: t }], typing: true }));
    const { answer } = await import('../lib/assistant');
    const r = answer(t, { lastProduct: get().last });
    await new Promise((res) => setTimeout(res, 420 + Math.min(700, r.text.length * 3)));
    set((s) => ({
      typing: false,
      last: r.context ?? s.last,
      msgs: [...s.msgs, { id: ++seq, role: 'bot', text: r.text, products: r.products, links: r.links, chips: r.chips }],
    }));
  },
}));

export function openChat(prefill?: string) {
  const s = useChat.getState();
  s.setOpen(true);
  if (prefill) void s.send(prefill);
}
