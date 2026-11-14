import { useEffect } from 'react';
import type { Product } from './catalog';

const SITE = 'TT-Shop.de';
const DEFAULT_DESC = 'TT-Shop – der Tischtennis-Fachhändler: Beläge, Hölzer, Profischläger, Bälle, Tische und Roboter mit technischen Daten, Montage-Service und persönlicher Beratung.';

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Seitentitel, Meta-Description und Open-Graph-Basics je Route */
export function usePageMeta(title: string | null, description?: string, image?: string) {
  useEffect(() => {
    if (!title) return;
    document.title = title === SITE ? `${SITE} – Der Tischtennis Shop` : `${title} | ${SITE}`;
    const desc = (description || DEFAULT_DESC).slice(0, 158);
    setMeta('description', desc);
    setMeta('og:title', title, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', 'website', 'property');
    if (image) setMeta('og:image', new URL(image, window.location.origin).href, 'property');
  }, [title, description, image]);
}

/** Strukturierte Daten (schema.org) als JSON-LD – für Rich Results in Suchmaschinen */
export function useJsonLd(id: string, data: object | null) {
  useEffect(() => {
    if (!data) return;
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => el?.remove();
  }, [id, JSON.stringify(data)]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function productLd(p: Product) {
  const origin = window.location.origin;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    sku: p.sku ?? undefined,
    brand: { '@type': 'Brand', name: p.brand },
    image: p.images.map((i) => origin + i),
    category: p.cat,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: p.price.toFixed(2),
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/BackOrder',
      itemCondition: 'https://schema.org/NewCondition',
      url: `${origin}/p/${p.id}`,
      seller: { '@type': 'Organization', name: 'TT-Shop.de (Tikotec UG)' },
    },
  };
}

export function breadcrumbLd(items: { to?: string; label: string }[]) {
  const origin = window.location.origin;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label, item: it.to ? origin + it.to : undefined })),
  };
}
