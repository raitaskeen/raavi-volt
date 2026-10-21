-- Catalog version for the edge page cache: every change to products (admin
-- edits, price changes, stock moving after an order) bumps it, so cached pages
-- keyed by the version are invalidated instantly in every data centre.

CREATE TABLE IF NOT EXISTS cache_meta (
  key    TEXT PRIMARY KEY,
  value  INTEGER NOT NULL
);

INSERT OR IGNORE INTO cache_meta (key, value) VALUES ('catalog', 1);

CREATE TRIGGER IF NOT EXISTS products_cache_bump_insert AFTER INSERT ON products
BEGIN
  UPDATE cache_meta SET value = value + 1 WHERE key = 'catalog';
END;

CREATE TRIGGER IF NOT EXISTS products_cache_bump_update AFTER UPDATE ON products
BEGIN
  UPDATE cache_meta SET value = value + 1 WHERE key = 'catalog';
END;

CREATE TRIGGER IF NOT EXISTS products_cache_bump_delete AFTER DELETE ON products
BEGIN
  UPDATE cache_meta SET value = value + 1 WHERE key = 'catalog';
END;
