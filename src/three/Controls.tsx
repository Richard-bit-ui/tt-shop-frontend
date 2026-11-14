import { lazy, Suspense, useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cx } from '../components/ui';
import type { FoldMode } from './tableSpec';

export const TableScene = lazy(() => import('./TableScene'));
export const ARSheet = lazy(() => import('./ARSheet'));

export function LazyScene({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="absolute inset-0 grid place-items-center text-[13px] text-muted">
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={18} /> 3D-Modell wird geladen …
          </span>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  const uid = useId();
  return (
    <div className={cx('relative inline-flex rounded-md border border-line bg-panel p-0.5', className)} role="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative z-10 flex h-8 flex-1 items-center justify-center gap-1.5 rounded px-3 text-[13px] font-medium whitespace-nowrap transition-colors',
              active ? 'text-white' : 'text-ink-2 hover:text-ink',
            )}
          >
            {active && <motion.span layoutId={`seg-${uid}`} className="absolute inset-0 -z-10 rounded bg-ink" transition={{ type: 'tween', duration: 0.18 }} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const FOLD_OPTIONS: { value: FoldMode; label: string }[] = [
  { value: 'play', label: 'Spielen' },
  { value: 'playback', label: 'Playback' },
  { value: 'park', label: 'Parken' },
];
