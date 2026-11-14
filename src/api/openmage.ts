/**
 * OpenMage-Anbindung (Magento-1-REST-API) – Vorlage für den Live-Betrieb.
 *
 * Status heute: tt-shop.de antwortet auf /api/rest/products mit 403 „Access denied“
 * (Gast-Rolle ohne Rechte). Der Prototyp nutzt deshalb statische Daten (src/data/catalog.json).
 *
 * Für den Live-Betrieb:
 *  1. OpenMage-Admin → System → Web Services → REST - Roles → „Guest“:
 *     Lesezugriff auf Product/Category freischalten (nur Retrieve!).
 *  2. System → Web Services → REST - Attributes → Guest: benötigte Attribute freigeben
 *     (name, sku, price, special_price, short_description, description, image_url, is_in_stock …).
 *  3. Warenkorb & Checkout laufen über einen kleinen Backend-for-Frontend (BFF) mit OAuth-
 *     Token (Customer/Admin-Rolle) oder über die OpenMage-Checkout-Endpunkte – niemals mit
 *     Admin-Credentials im Browser.
 *  4. In vite.config.ts einen Proxy setzen: server.proxy['/api/rest'] = 'https://www.tt-shop.de'
 *     und VITE_CATALOG_SOURCE=openmage.
 *
 * Die Funktionen unten mappen die Magento-1-REST-Antworten auf das Product-Modell des Frontends.
 */
import type { CatId, OptionGroup, Product, Specs } from '../lib/catalog';

/** Felder, die die Magento-1-REST-API für Produkte liefert (Auszug) */
export interface MageRestProduct {
  entity_id: string;
  sku: string;
  name: string;
  url_key?: string;
  type_id: string;
  price?: string;
  special_price?: string | null;
  final_price_with_tax?: number;
  regular_price_with_tax?: number;
  short_description?: string;
  description?: string;
  image_url?: string;
  is_in_stock?: '0' | '1';
  is_saleable?: '0' | '1';
  manufacturer?: string;
  [attribute: string]: unknown;
}

export interface MageRestImage {
  id: string;
  label: string | null;
  position: string;
  exclude: '0' | '1';
  url: string;
  types: string[];
}

const BASE = '/api/rest';

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const r = await fetch(`${BASE}${path}${qs.size ? '?' + qs : ''}`, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`OpenMage ${path}: ${r.status}`);
  return r.json() as Promise<T>;
}

const stripHtml = (html = '') =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Produktliste einer Kategorie – Magento 1 REST paginiert mit page/limit (max. 100) */
export async function fetchCategoryProducts(categoryId: number, page = 1, limit = 24) {
  const data = await get<Record<string, MageRestProduct>>('/products', { category_id: categoryId, page, limit, order: 'position', dir: 'asc' });
  return Object.values(data);
}

export async function fetchProductImages(entityId: string) {
  const imgs = await get<MageRestImage[]>(`/products/${entityId}/images`);
  return imgs
    .filter((i) => i.exclude !== '1')
    .sort((a, b) => +a.position - +b.position)
    .map((i) => i.url);
}

/** Mapping Magento-1-REST → Frontend-Produkt (Varianten kommen aus /products/:id/… bzw. Bundle-Optionen) */
export function mapProduct(p: MageRestProduct, ctx: { cat: CatId; sub: string; images: string[]; options?: OptionGroup[]; specs?: Specs }): Product {
  const regular = p.regular_price_with_tax ?? parseFloat(p.price ?? '0');
  const final = p.final_price_with_tax ?? (p.special_price ? parseFloat(p.special_price) : regular);
  return {
    id: p.url_key ?? p.entity_id,
    sku: p.sku,
    title: p.name,
    tag: null,
    brand: (p.manufacturer as string) || 'TT-Shop',
    series: null,
    cat: ctx.cat,
    sub: ctx.sub,
    price: final,
    oldPrice: final < regular ? regular : null,
    sale: final < regular,
    inStock: p.is_in_stock !== '0',
    discontinued: false,
    delivery: null,
    images: ctx.images.length ? ctx.images : p.image_url ? [p.image_url] : [],
    specs: ctx.specs ?? {},
    options: ctx.options ?? [],
    hasOptions: !!ctx.options?.length,
    hasRequired: !!ctx.options?.some((g) => g.required),
    hasVariants: !!ctx.options?.some((g) => g.kind === 'variant'),
    table: null,
    unitPrice: null,
    freight: ctx.cat === 'tische',
  };
}

/** Beschreibungstext für die Produktseite */
export const mapDescription = (p: MageRestProduct) => ({
  short: stripHtml(p.short_description).slice(0, 320),
  paragraphs: stripHtml(p.description)
    .split(/(?<=\.)\s+(?=[A-ZÄÖÜ])/)
    .slice(0, 3),
});
