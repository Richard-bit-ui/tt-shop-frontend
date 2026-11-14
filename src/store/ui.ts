import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getProduct } from '../lib/catalog';
import type { LineOption } from './cart';
import type { TableColor } from '../three/tableSpec';

interface UIState {
  added: { id: string; qty: number; color?: TableColor; opts?: LineOption[]; bundle?: string; at: number } | null;
  searchOpen: boolean;
  menuOpen: boolean;
  toast: { text: string; at: number } | null;
  quickView: string | null;
  setQuickView: (id: string | null) => void;
  showAdded: (a: { id: string; qty: number; color?: TableColor; opts?: LineOption[]; bundle?: string }) => void;
  closeAdded: () => void;
  setSearch: (v: boolean) => void;
  setMenu: (v: boolean) => void;
  notify: (text: string) => void;
}

export const useUI = create<UIState>((set) => ({
  added: null,
  searchOpen: false,
  menuOpen: false,
  toast: null,
  quickView: null,
  setQuickView: (quickView) => set({ quickView }),
  showAdded: (a) => set({ added: { ...a, at: Date.now() } }),
  closeAdded: () => set({ added: null }),
  setSearch: (searchOpen) => set({ searchOpen }),
  setMenu: (menuOpen) => set({ menuOpen }),
  notify: (text) => set({ toast: { text, at: Date.now() } }),
}));

export const COMPARE_MAX = 4;

interface SavedState {
  wishlist: string[];
  recent: string[];
  searches: string[];
  compare: string[];
  toggleWish: (id: string) => boolean;
  /** true = hinzugefügt, false = entfernt, 'full' = Limit je Kategorie erreicht */
  toggleCompare: (id: string) => boolean | 'full';
  clearCompare: (cat?: string) => void;
  viewed: (id: string) => void;
  searched: (q: string) => void;
  clearSearches: () => void;
}

export const useSaved = create<SavedState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      recent: [],
      searches: [],
      compare: [],
      toggleWish: (id) => {
        const has = get().wishlist.includes(id);
        set({ wishlist: has ? get().wishlist.filter((x) => x !== id) : [id, ...get().wishlist] });
        return !has;
      },
      toggleCompare: (id) => {
        const list = get().compare;
        if (list.includes(id)) {
          set({ compare: list.filter((x) => x !== id) });
          return false;
        }
        const cat = getProduct(id)?.cat;
        if (list.filter((x) => getProduct(x)?.cat === cat).length >= COMPARE_MAX) return 'full';
        set({ compare: [...list, id] });
        return true;
      },
      clearCompare: (cat) => set({ compare: cat ? get().compare.filter((x) => getProduct(x)?.cat !== cat) : [] }),
      viewed: (id) => set((s) => ({ recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 12) })),
      searched: (q) => set((s) => ({ searches: [q, ...s.searches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6) })),
      clearSearches: () => set({ searches: [] }),
    }),
    { name: 'tt-saved-v2' },
  ),
);
