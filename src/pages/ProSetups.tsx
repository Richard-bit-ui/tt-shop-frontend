import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Wrench } from 'lucide-react';
import { formatPrice, PRO_RACKETS, useOptions, type Product } from '../lib/catalog';
import { Breadcrumbs, Img, Tag } from '../components/ui';
import { usePageMeta } from '../lib/seo';

/**
 * Profi-Setups: die Spieler-Schläger aus dem Sortiment (Profischläger <Name>) mit Kurzporträt
 * aus der Produktbeschreibung und den wählbaren Belägen aus den Produktoptionen.
 */

const rubbersOf = (p: Product, group: string) => [...new Set((p.options.find((o) => o.name === group)?.values ?? []).map((v) => v.label.split(', ')[0]).filter(Boolean))];

function bio(paragraphs: string[] | undefined, name: string): string | null {
  const first = name.split(' ')[0];
  const para = paragraphs?.find((t) => t.startsWith(first) || t.includes(`${name} ist`)) ?? paragraphs?.[0];
  if (!para) return null;
  const sentences = para.match(/[^.!?]+[.!?]+/g) ?? [para];
  return sentences.slice(0, 2).join(' ').trim();
}

export default function ProSetups() {
  useOptions();
  usePageMeta('Profi-Setups: Schläger der Tischtennis-Stars', 'Komplett montierte Schläger nach den Material-Kombinationen von Calderano, Lebrun, Moregard, Szocs und weiteren Profis.');
  const [details, setDetails] = useState<Record<string, { paragraphs?: string[]; short?: string }> | null>(null);
  useEffect(() => {
    import('../data/details.json').then((m) => setDetails(m.default as Record<string, { paragraphs?: string[] }>));
  }, []);
  return (
    <div className="container-x pb-20">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { to: '/c/schlaeger', label: 'Schläger' }, { label: 'Profi-Setups' }]} />
      <div className="max-w-3xl">
        <h1 className="h1">Profi-Setups.</h1>
        <p className="mt-3 text-[17px] leading-snug text-muted sm:text-[19px]">
          {PRO_RACKETS.length} komplette Schläger nach den Material-Kombinationen bekannter Spielerinnen und Spieler – von uns montiert, auf Wunsch versiegelt. Bei vielen Setups kannst du Belag und
          Schwammstärke anpassen.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {PRO_RACKETS.map((p) => {
          const name = p.title.replace(/^Profischläger\s+/, '');
          const vh = rubbersOf(p, 'Belag 1');
          const rh = rubbersOf(p, 'Belag 2');
          const text = details ? bio(details[p.id]?.paragraphs, name) : null;
          return (
            <article key={p.id} className="store-card flex flex-col">
              <div className="flex gap-4 p-4 pb-2">
                <Link to={`/p/${p.id}`} className="size-28 shrink-0 tile rounded-[16px] p-2">
                  <Img thumb src={p.images[0]} alt={`Schläger ${name}`} className="size-full object-contain" />
                </Link>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-red">Profi-Setup</div>
                  <h2 className="mt-0.5 text-[22px] leading-tight font-semibold tracking-[-0.02em]">{name}</h2>
                  <div className="num mt-1.5 text-[16px] font-semibold">{formatPrice(p.price)}</div>
                  <div className="text-[12px] text-muted">inkl. Montage, zzgl. Versand</div>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4 text-[13.5px]">
                {text ? <p className="text-ink-2">{text}</p> : <div className="h-10 animate-pulse rounded bg-panel" />}
                {(vh.length > 0 || rh.length > 0) && (
                  <dl className="mt-3 space-y-1.5">
                    {vh.length > 0 && (
                      <div>
                        <dt className="text-[12px] text-muted">Belag Vorhand {vh.length > 1 ? '(Auswahl)' : ''}</dt>
                        <dd className="flex flex-wrap gap-1">
                          {vh.map((r) => (
                            <Tag key={r}>{r}</Tag>
                          ))}
                        </dd>
                      </div>
                    )}
                    {rh.length > 0 && (
                      <div>
                        <dt className="text-[12px] text-muted">Belag Rückhand {rh.length > 1 ? '(Auswahl)' : ''}</dt>
                        <dd className="flex flex-wrap gap-1">
                          {rh.map((r) => (
                            <Tag key={r}>{r}</Tag>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
                <Link to={`/p/${p.id}`} className="btn btn-dark btn-sm mt-auto w-full">
                  Setup ansehen <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-start gap-3 rounded-lg bg-panel p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[15px] font-semibold">Lieber eine eigene Kombination?</div>
          <div className="text-[13.5px] text-muted">Holz und Beläge frei wählen – wir montieren inkl. Kantenband für 2,00 €.</div>
        </div>
        <Link to="/konfigurator" className="btn btn-primary btn-sm">
          <Wrench size={15} /> Zum Schläger-Konfigurator
        </Link>
      </div>
    </div>
  );
}
