-- Raavi Volt schema. Money is stored as whole PKR integers.

CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  brand        TEXT NOT NULL DEFAULT 'Geepas',
  category     TEXT NOT NULL,
  sku          TEXT,
  price        INTEGER NOT NULL CHECK (price >= 0),
  compare_at   INTEGER CHECK (compare_at IS NULL OR compare_at >= 0),
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  short_desc   TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  specs        TEXT NOT NULL DEFAULT '[]',  -- JSON: [{ "label": "", "value": "" }]
  images       TEXT NOT NULL DEFAULT '[]',  -- JSON: ["products/<uuid>.webp"]
  warranty     TEXT,
  featured     INTEGER NOT NULL DEFAULT 0,
  active       INTEGER NOT NULL DEFAULT 1,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_products_active_category ON products (active, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products (active, featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_price ON products (active, price);

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,
  customer_name    TEXT NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT,
  city             TEXT NOT NULL,
  area             TEXT,
  address          TEXT NOT NULL,
  postal_code      TEXT,
  notes            TEXT,
  items            TEXT NOT NULL,            -- JSON snapshot of purchased lines
  subtotal         INTEGER NOT NULL,
  shipping         INTEGER NOT NULL,
  total            INTEGER NOT NULL,
  payment_account  TEXT NOT NULL,            -- id from config/store.ts paymentAccounts
  payment_ref      TEXT,                     -- transaction id the customer submits
  payment_payer    TEXT,                     -- name on the sending account
  payment_proof    TEXT,                     -- private R2 key of the screenshot
  status           TEXT NOT NULL DEFAULT 'awaiting_payment',
  created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);
