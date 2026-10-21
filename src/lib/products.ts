import { db } from "@/lib/cf";
import type { SortValue } from "@/lib/sort";

export type Spec = { label: string; value: string };

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAt: number | null;
  stock: number;
  shortDesc: string;
  images: string[];
  featured: boolean;
  active: boolean;
};

export type Product = ProductSummary & {
  sku: string | null;
  description: string;
  specs: Spec[];
  warranty: string | null;
  createdAt: number;
  updatedAt: number;
};

type Row = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  sku?: string | null;
  price: number;
  compare_at: number | null;
  stock: number;
  short_desc: string;
  description?: string;
  specs?: string;
  images: string;
  warranty?: string | null;
  featured: number;
  active: number;
  created_at?: number;
  updated_at?: number;
};

const SUMMARY_COLS =
  "id, slug, name, brand, category, price, compare_at, stock, short_desc, images, featured, active";

function parseJSON<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toSummary(r: Row): ProductSummary {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    category: r.category,
    price: r.price,
    compareAt: r.compare_at,
    stock: r.stock,
    shortDesc: r.short_desc,
    images: parseJSON<string[]>(r.images, []),
    featured: r.featured === 1,
    active: r.active === 1,
  };
}

function toProduct(r: Row): Product {
  return {
    ...toSummary(r),
    sku: r.sku ?? null,
    description: r.description ?? "",
    specs: parseJSON<Spec[]>(r.specs, []),
    warranty: r.warranty ?? null,
    createdAt: r.created_at ?? 0,
    updatedAt: r.updated_at ?? 0,
  };
}


const ORDER_BY: Record<SortValue, string> = {
  featured: "featured DESC, created_at DESC",
  newest: "created_at DESC",
  "price-asc": "price ASC",
  "price-desc": "price DESC",
};

export type ListParams = {
  category?: string;
  brand?: string;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  /** Admin view: include hidden products. */
  includeInactive?: boolean;
};

export async function listProducts(params: ListParams = {}) {
  const where: string[] = [];
  const binds: (string | number)[] = [];

  if (!params.includeInactive) where.push("active = 1");
  if (params.category) {
    where.push("category = ?");
    binds.push(params.category);
  }
  if (params.brand) {
    where.push("brand = ?");
    binds.push(params.brand);
  }
  if (params.featured) where.push("featured = 1");
  if (params.onSale) where.push("compare_at > price");
  if (params.inStock) where.push("stock > 0");
  if (params.minPrice) {
    where.push("price >= ?");
    binds.push(params.minPrice);
  }
  if (params.maxPrice) {
    where.push("price <= ?");
    binds.push(params.maxPrice);
  }
  if (params.q?.trim()) {
    const term = `%${params.q.trim().replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    where.push("(name LIKE ? ESCAPE '\\' OR brand LIKE ? ESCAPE '\\' OR sku LIKE ? ESCAPE '\\')");
    binds.push(term, term, term);
  }

  const sort = (params.sort && params.sort in ORDER_BY ? params.sort : "featured") as SortValue;
  const pageSize = Math.min(Math.max(params.pageSize ?? 24, 1), 100);
  const page = Math.max(params.page ?? 1, 1);
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows, count] = await db().batch([
    db()
      .prepare(`SELECT ${SUMMARY_COLS} FROM products ${whereSql} ORDER BY ${ORDER_BY[sort]} LIMIT ? OFFSET ?`)
      .bind(...binds, pageSize, (page - 1) * pageSize),
    db().prepare(`SELECT COUNT(*) AS n FROM products ${whereSql}`).bind(...binds),
  ]);

  const total = (count.results[0] as { n: number } | undefined)?.n ?? 0;
  return {
    items: (rows.results as Row[]).map(toSummary),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Biggest discounts first — powers the deals strip and deal of the day. */
export async function listDeals(limit = 8) {
  const { results } = await db()
    .prepare(
      `SELECT ${SUMMARY_COLS} FROM products
       WHERE active = 1 AND stock > 0 AND compare_at > price
       ORDER BY (compare_at - price) * 1.0 / compare_at DESC, featured DESC LIMIT ?`,
    )
    .bind(limit)
    .all<Row>();
  return results.map(toSummary);
}

export async function getProductBySlug(slug: string) {
  const row = await db().prepare("SELECT * FROM products WHERE slug = ? AND active = 1").bind(slug).first<Row>();
  return row ? toProduct(row) : null;
}

export async function getProductById(id: string) {
  const row = await db().prepare("SELECT * FROM products WHERE id = ?").bind(id).first<Row>();
  return row ? toProduct(row) : null;
}

export async function getRelatedProducts(product: Pick<Product, "id" | "category">, limit = 4) {
  const { results } = await db()
    .prepare(`SELECT ${SUMMARY_COLS} FROM products WHERE active = 1 AND category = ? AND id != ? ORDER BY featured DESC, created_at DESC LIMIT ?`)
    .bind(product.category, product.id, limit)
    .all<Row>();
  return results.map(toSummary);
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const { results } = await db()
    .prepare(`SELECT ${SUMMARY_COLS} FROM products WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all<Row>();
  return results.map(toSummary);
}

export async function listSlugs() {
  const { results } = await db()
    .prepare("SELECT slug, updated_at FROM products WHERE active = 1")
    .all<{ slug: string; updated_at: number }>();
  return results;
}

/* ---------------------------------- admin --------------------------------- */

export type ProductInput = {
  name: string;
  slug: string;
  brand: string;
  category: string;
  sku: string | null;
  price: number;
  compareAt: number | null;
  stock: number;
  shortDesc: string;
  description: string;
  specs: Spec[];
  images: string[];
  warranty: string | null;
  featured: boolean;
  active: boolean;
};

export async function slugExists(slug: string, exceptId?: string) {
  const row = await db()
    .prepare("SELECT id FROM products WHERE slug = ? AND id != ?")
    .bind(slug, exceptId ?? "")
    .first<{ id: string }>();
  return Boolean(row);
}

export async function createProduct(input: ProductInput) {
  const id = crypto.randomUUID();
  await db()
    .prepare(
      `INSERT INTO products (id, slug, name, brand, category, sku, price, compare_at, stock, short_desc, description, specs, images, warranty, featured, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.slug,
      input.name,
      input.brand,
      input.category,
      input.sku,
      input.price,
      input.compareAt,
      input.stock,
      input.shortDesc,
      input.description,
      JSON.stringify(input.specs),
      JSON.stringify(input.images),
      input.warranty,
      input.featured ? 1 : 0,
      input.active ? 1 : 0,
    )
    .run();
  return id;
}

export async function updateProduct(id: string, input: ProductInput) {
  await db()
    .prepare(
      `UPDATE products SET slug = ?, name = ?, brand = ?, category = ?, sku = ?, price = ?, compare_at = ?, stock = ?,
         short_desc = ?, description = ?, specs = ?, images = ?, warranty = ?, featured = ?, active = ?, updated_at = unixepoch()
       WHERE id = ?`,
    )
    .bind(
      input.slug,
      input.name,
      input.brand,
      input.category,
      input.sku,
      input.price,
      input.compareAt,
      input.stock,
      input.shortDesc,
      input.description,
      JSON.stringify(input.specs),
      JSON.stringify(input.images),
      input.warranty,
      input.featured ? 1 : 0,
      input.active ? 1 : 0,
      id,
    )
    .run();
}

export async function deleteProduct(id: string) {
  await db().prepare("DELETE FROM products WHERE id = ?").bind(id).run();
}

export async function productStats() {
  const row = await db()
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END) AS low_stock
       FROM products`,
    )
    .first<{ total: number; active: number | null; low_stock: number | null }>();
  return { total: row?.total ?? 0, active: row?.active ?? 0, lowStock: row?.low_stock ?? 0 };
}

export async function lowStockProducts(limit = 6, threshold = 5) {
  const { results } = await db()
    .prepare(`SELECT ${SUMMARY_COLS} FROM products WHERE stock <= ? ORDER BY stock ASC, name ASC LIMIT ?`)
    .bind(threshold, limit)
    .all<Row>();
  return results.map(toSummary);
}

/** Category & brand counts for the shop filter sidebar (active products only). */
export async function shopFacets() {
  const d = db();
  const [cats, brandRows, sale] = await d.batch([
    d.prepare("SELECT category AS k, COUNT(*) AS n FROM products WHERE active = 1 GROUP BY category"),
    d.prepare("SELECT brand AS k, COUNT(*) AS n FROM products WHERE active = 1 GROUP BY brand ORDER BY n DESC, brand"),
    d.prepare("SELECT COUNT(*) AS n FROM products WHERE active = 1 AND compare_at > price"),
  ]);
  type KV = { k: string; n: number };
  return {
    categories: Object.fromEntries((cats.results as KV[]).map((r) => [r.k, r.n])) as Record<string, number>,
    brands: brandRows.results as KV[],
    total: (cats.results as KV[]).reduce((a, r) => a + r.n, 0),
    onSale: (sale.results[0] as { n: number } | undefined)?.n ?? 0,
  };
}
