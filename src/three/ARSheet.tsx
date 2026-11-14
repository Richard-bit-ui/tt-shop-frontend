import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Info, Loader2, ScanLine, Smartphone } from 'lucide-react';
import { Sheet } from '../components/ui';
import { TABLE_COLORS, type TableColor, type TableKind } from './tableSpec';

import { asset, BASE_PATH } from '../lib/asset';
declare const __LAN_IP__: string;

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}

interface ModelViewerEl extends HTMLElement {
  canActivateAR: boolean;
  activateAR: () => Promise<void>;
}

export const modelUrl = (kind: TableKind, color: TableColor) => asset(`/models/platte-${kind}-${color}.glb`);

/** URL, die das Handy im selben WLAN öffnen kann (localhost → LAN-IP des Rechners) */
export function phoneUrl(path: string) {
  const { protocol, hostname, port } = window.location;
  const host = hostname === 'localhost' || hostname === '127.0.0.1' ? __LAN_IP__ : hostname;
  return `${protocol}//${host}${port ? ':' + port : ''}${BASE_PATH}${path}`;
}

export default function ARSheet({ open, onClose, kind, color, title, sharePath }: { open: boolean; onClose: () => void; kind: TableKind; color: TableColor; title: string; sharePath: string }) {
  const [lib, setLib] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [canAR, setCanAR] = useState<boolean | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const ref = useRef<ModelViewerEl | null>(null);
  const url = phoneUrl(sharePath);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    import('@google/model-viewer').then(() => alive && setLib(true));
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: '#0e0e10', light: '#ffffff' } }).then((d) => alive && setQr(d));
    return () => {
      alive = false;
    };
  }, [open, url]);

  useEffect(() => {
    setLoaded(false);
    setCanAR(null);
  }, [kind, color]);

  // Callback-Ref: hängt die Listener garantiert an, sobald <model-viewer> im DOM ist
  const cleanup = useRef<(() => void) | null>(null);
  const attach = useCallback((el: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    ref.current = el as ModelViewerEl | null;
    if (!el) return;
    const mv = el as ModelViewerEl & { loaded?: boolean };
    const done = () => {
      setLoaded(true);
      setCanAR(!!mv.canActivateAR);
    };
    mv.addEventListener('load', done);
    const t = window.setInterval(() => {
      if (mv.loaded) {
        done();
        window.clearInterval(t);
      }
    }, 250);
    cleanup.current = () => {
      mv.removeEventListener('load', done);
      window.clearInterval(t);
    };
  }, []);

  return (
    <Sheet open={open} onClose={onClose} title="In deinem Raum ansehen" wide>
      <div className="pb-6">
        <p className="text-[14px] text-muted">
          {title} · Farbe {TABLE_COLORS[color].label} · Maßstab 1:1
        </p>
        <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-panel">
          {lib && (
            <model-viewer
              ref={attach}
              src={modelUrl(kind, color)}
              alt={`3D-Modell ${title}`}
              ar=""
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              ar-placement="floor"
              camera-controls=""
              touch-action="pan-y"
              shadow-intensity="1.1"
              shadow-softness="0.8"
              exposure="1.05"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="35deg 68deg 5.6m"
              auto-rotate=""
              auto-rotate-delay="1200"
              interaction-prompt="none"
            >
              <div slot="progress-bar" />
              <button slot="ar-button" className="btn btn-primary absolute inset-x-4 bottom-4 shadow-pop">
                <ScanLine size={18} /> Jetzt im Raum platzieren
              </button>
            </model-viewer>
          )}
          {!loaded && (
            <div className="absolute inset-0 grid place-items-center text-muted">
              <Loader2 className="animate-spin" />
            </div>
          )}
        </div>

        {canAR === false && (
          <div className="mt-5 grid items-center gap-5 rounded-2xl border border-line p-5 sm:grid-cols-[150px_1fr]">
            {qr && <img src={qr} alt="QR-Code zum Öffnen auf dem Smartphone" className="mx-auto size-[150px] rounded-xl" />}
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[15px] font-semibold">
                <Smartphone size={18} /> Mit dem Smartphone scannen
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                AR braucht Kamera und Bewegungssensoren. Scanne den Code mit deinem Handy (gleiches WLAN), tippe auf „Jetzt im Raum platzieren“ und stell die Platte in Originalgröße in deinen Keller,
                Garten oder Hobbyraum.
              </p>
              <div className="mt-2 truncate text-[12px] text-subtle">{url}</div>
            </div>
          </div>
        )}
        <div className="mt-4 flex gap-2.5 rounded-xl bg-panel px-4 py-3 text-[12.5px] leading-relaxed text-ink-2">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>iPhone: AR Quick Look · Android: Google Scene Viewer bzw. WebXR (benötigt HTTPS). Die Platte erscheint in echter Größe: 274 × 152,5 × 76 cm.</span>
        </div>
      </div>
    </Sheet>
  );
}
