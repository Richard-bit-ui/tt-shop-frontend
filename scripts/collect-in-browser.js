// Dokumentation: So wurde scripts/raw-catalog.json erzeugt.
// Dieses Snippet läuft in der Browser-Konsole auf https://www.tt-shop.de (gleiche Origin,
// daher keine CORS-/Bot-Probleme) und sammelt Kategorie- + Produktdaten aus dem
// OpenMage-Frontend-HTML. Ergebnis: window.__cat → als JSON nach scripts/raw-catalog.json.
//
// Für den Live-Betrieb wird das durch die OpenMage-REST-API ersetzt (src/api/openmage.ts).

const CATS = [
  ['outdoor-platten', '/de/tischtennis-platten/outdoor-tischtennisplatten.html', 13, 6],
  ['indoor-platten', '/de/tischtennis-platten/indoor-tischtennisplatten.html', 12, 6],
  ['wettkampftische', '/de/tischtennis-tische.html', 8, 5],
  ['profischlaeger', '/de/tischtennisschlaeger/profi-tischtennisschlaeger.html', 12, 3],
  ['fertigschlaeger', '/de/tischtennisschlaeger.html', 12, 3],
  ['belaege', '/de/tischtennis-belaege.html', 12, 3],
  ['hoelzer', '/de/tischtennis-hoelzer.html', 12, 3],
  ['baelle', '/de/tischtennis-baelle/wettkampfbaelle-plastik.html', 10, 2],
  ['roboter', '/de/tischtennis-roboter.html', 10, 4],
  ['schuhe', '/de/tischtennis-schuhe.html', 10, 4],
  ['bekleidung', '/de/tischtennis-bekleidung.html', 10, 3],
  ['zubehoer', '/de/tischtennis-zubehoer.html', 10, 3],
];
const num = (s) => (s ? parseFloat(s.replace(/[^\d,]/g, '').replace(',', '.')) : null);
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const strip = (u) => u && u.replace(/^https?:\/\/www\.tt-shop\.de/, '').replace(/\/cache\/\d+\/[a-z_]+\/(\d+x\d*\/)?[0-9a-f]{32}\//, '/').replace('/media/catalog/product', '');
const P = (s) => new DOMParser().parseFromString(s, 'text/html');
const seen = new Set();
const out = [];
for (const [cid, path, take, nimg] of CATS) {
  const d = P(await (await fetch(path)).text());
  const items = [...d.querySelectorAll('.category-products li.item')]
    .map((li) => {
      const a = li.querySelector('.product-name a');
      return a && { n: clean(a.textContent), u: a.getAttribute('href'), pr: [...li.querySelectorAll('.price-box .price')].map((e) => num(e.textContent)), lab: li.querySelector('.productlabels_icons img')?.alt || null };
    })
    .filter((x) => x && x.pr.some((v) => v > 2))
    .filter((x) => { const id = x.u.split('/').pop().replace('.html', ''); if (seen.has(id)) return false; seen.add(id); return true; })
    .slice(0, take);
  for (const it of items) {
    const dd = P(await (await fetch(it.u)).text());
    const attrs = {};
    dd.querySelectorAll('#product-attribute-specs-table tr').forEach((tr) => { const k = clean(tr.querySelector('th')?.textContent), v = clean(tr.querySelector('td')?.textContent); if (k && v && k !== 'GPSR') attrs[k] = v; });
    const img = [...new Set([...dd.querySelectorAll('.more-views a, .product-img-box a')].map((a) => strip(a.getAttribute('href') || '')).filter((u) => u && /\.(jpe?g|png|webp)$/i.test(u)))].slice(0, nimg);
    const pb = dd.querySelector('.product-shop .price-box');
    const old = num(pb?.querySelector('.old-price .price')?.textContent);
    const fin = num(pb?.querySelector('.special-price .price')?.textContent) ?? num(pb?.querySelector('.regular-price .price')?.textContent) ?? it.pr.find((v) => v > 2);
    const av = clean(dd.querySelector('.availability')?.textContent || '');
    const desc = dd.querySelector('.box-description .std') || dd.querySelector('.box-description');
    out.push({
      id: it.u.split('/').pop().replace('.html', ''), c: cid, n: it.n, sku: (av.match(/SKU:\s*([^\s|]+)/) || [])[1] || null,
      p: fin, o: old && old > fin ? old : null, s: it.lab === 'SALE', st: !/nicht verfügbar|ausverkauft/i.test(av), img,
      sh: clean(dd.querySelector('.short-description')?.textContent).replace(/^Kurzübersicht\s*/, '').slice(0, 300),
      d: [...(desc?.querySelectorAll('p') || [])].map((p) => clean(p.textContent)).filter((t) => t.length > 60).slice(0, 2),
      b: [...(desc?.querySelectorAll('li') || [])].map((l) => clean(l.textContent)).filter((t) => t.length > 3 && t.length < 110).slice(0, 5),
      a: attrs,
    });
  }
}
window.__cat = out;
