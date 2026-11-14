import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitCompareArrows, X } from 'lucide-react';
import { CATEGORIES, fmtNum, getProduct, SPEC_ROWS, useOptions, type CatId, type Product } from '../lib/catalog';
import { deliveryWindow } from '../lib/delivery';
import { COMPARE_MAX, useSaved } from '../store/ui';
import { StockLine } from '../components/ProductCard';
import { Breadcrumbs, cx, HardnessGauge, Img, Price } from '../components/ui';
import { usePageMeta } from '../lib/seo';

export default function Compare() {
  useOptions();
  usePageMeta('Produktvergleich');
  const ids = useSaved((s) => s.compare);
  const toggle = useSaved((s) => s.toggleCompare);
  const clear = useSaved((s) => s.clearCompare);
  const items = ids.map((id) => getProduct(id)).filter(Boolean) as Product[];
  const cats = [...new Set(items.map((p) => p.cat))] as CatId[];
  const [catSel, setCat] = useState<CatId | null>(null);
  const cat = catSel && cats.includes(catSel) ? catSel : cats[0];
  const list = items.filter((p) => p.cat === cat);
  const [diffOnly, setDiffOnly] = useState(false);

  const rows = useMemo(() => {
    if (!cat) return [];
    const spec = SPEC_ROWS[cat].map((r) => ({ label: r.label, values: list.map((p) => r.value(p)) }));
    const base = [
      { label: 'Marke', values: list.map((p) => p.brand) },
      ...spec,
      { label: 'Lieferung', values: list.map((p) => deliveryWindow(p).label) },
      { label: 'Artikelnummer', values: list.map((p) => p.sku) },
    ];
    return base.filter((r) => r.values.some(Boolean));
  }, [cat, list]);
  const shown = diffOnly ? rows.filter((r) => new Set(r.values.map((v) => v ?? '–')).size > 1) : rows;

  return (
    <div className="container-x pb-24">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Produktvergleich' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="h1">Produktvergleich</h1>
        {items.length > 0 && (
          <button type="button" onClick={() => clear(cat)} className="text-[13px] text-info hover:underline">
            Vergleich leeren
          </button>
        )}
      </div>

      {!items.length ? (
        <div className="panel mt-6 px-6 py-14 text-center">
          <GitCompareArrows size={28} className="mx-auto text-muted" />
          <div className="mt-3 text-[16px] font-semibold">Noch keine Artikel im Vergleich</div>
          <p className="mx-auto mt-1 max-w-md text-[14px] text-muted">
            Setze bei bis zu {COMPARE_MAX} Belägen, Hölzern oder Tischen das Häkchen „Vergleichen“ – hier stehen dann alle technischen Daten nebeneinander.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to="/c/belaege" className="btn btn-dark btn-sm">
              Beläge vergleichen
            </Link>
            <Link to="/c/hoelzer" className="btn btn-outline btn-sm">
              Hölzer vergleichen
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {cats.length > 1 &&
              cats.map((c) => (
                <button key={c} type="button" aria-pressed={c === cat} onClick={() => setCat(c)} className="chip">
                  {CATEGORIES.find((x) => x.id === c)?.name} ({items.filter((p) => p.cat === c).length})
                </button>
              ))}
            <label className="ml-auto flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} className="check" /> Nur Unterschiede anzeigen
            </label>
          </div>

          <div className="-mx-4 mt-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[640px] table-fixed border-collapse text-[14px]">
              <colgroup>
                <col className="w-[150px] sm:w-[190px]" />
                {list.map((p) => (
                  <col key={p.id} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th />
                  {list.map((p) => (
                    <th key={p.id} className="border-l border-line px-3 pb-4 text-left align-top font-normal">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => toggle(p.id)}
                          aria-label="Aus dem Vergleich entfernen"
                          className="absolute top-0 right-0 grid size-7 place-items-center rounded bg-white text-muted hover:text-ink"
                        >
                          <X size={16} />
                        </button>
                        <Link to={`/p/${p.id}`} className="block">
                          <div className="mx-auto aspect-square w-full max-w-[150px] p-2">
                            <Img thumb src={p.images[0]} alt="" className="size-full object-contain" />
                          </div>
                          <div className="mt-2 text-[12.5px] text-muted">{p.brand}</div>
                          <div className="line-clamp-2 text-[14px] font-semibold hover:underline">{p.title}</div>
                        </Link>
                        <Price p={p} size="md" className="mt-1.5" />
                        <StockLine p={p} className="mt-1" />
                        <Link to={`/p/${p.id}`} className="btn btn-primary btn-sm mt-3 w-full">
                          Zum Artikel
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cat === 'belaege' && list.some((p) => p.specs.hardness) && (!diffOnly || new Set(list.map((p) => p.specs.hardness)).size > 1) && (
                  <tr className="border-t border-line">
                    <td className="py-3 pr-3 text-[13px] font-medium text-muted">Härte-Skala</td>
                    {list.map((p) => (
                      <td key={p.id} className="border-l border-line px-3 py-3">
                        {p.specs.hardness ? (
                          <div>
                            <div className="num mb-1.5 font-semibold">{fmtNum(p.specs.hardness)}°</div>
                            <HardnessGauge value={p.specs.hardness} compact />
                          </div>
                        ) : (
                          <span className="text-subtle">–</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )}
                {shown.map((r, i) => (
                  <tr key={r.label} className={cx('border-t border-line', i % 2 === 0 && 'bg-panel/60')}>
                    <td className="py-2.5 pr-3 text-[13px] font-medium text-muted">{r.label}</td>
                    {r.values.map((v, j) => (
                      <td key={j} className="border-l border-line px-3 py-2.5">
                        {v ?? <span className="text-subtle">–</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length < COMPARE_MAX && (
            <p className="mt-4 text-[13px] text-muted">
              Du kannst noch {COMPARE_MAX - list.length} weitere {CATEGORIES.find((c) => c.id === cat)?.name} hinzufügen –{' '}
              <Link to={`/c/${cat}`} className="link">
                zur Kategorie
              </Link>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}
