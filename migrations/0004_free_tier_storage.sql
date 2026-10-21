-- Free-tier storage: product images / payment proofs and rate limiting live in
-- D1 (hard free limits, no card) instead of R2 and the Rate Limiting binding.

CREATE TABLE IF NOT EXISTS files (
  key           TEXT PRIMARY KEY,          -- e.g. products/<uuid>.webp, proofs/<code>/<uuid>.png
  content_type  TEXT NOT NULL,
  size          INTEGER NOT NULL,          -- bytes
  chunks        INTEGER NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- base64 text in ≤ 1.5 MB pieces (D1 rows max out at 2 MB).
CREATE TABLE IF NOT EXISTS file_chunks (
  key   TEXT NOT NULL,
  idx   INTEGER NOT NULL,
  data  TEXT NOT NULL,
  PRIMARY KEY (key, idx)
);

-- Fixed one-minute windows per action + client IP.
CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT PRIMARY KEY,
  window_start  INTEGER NOT NULL,
  count         INTEGER NOT NULL
);
