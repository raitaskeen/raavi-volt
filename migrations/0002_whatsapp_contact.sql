-- WhatsApp notifications, contact messages and shipment details.

-- Customer consent for WhatsApp order updates (required by WhatsApp policy).
ALTER TABLE orders ADD COLUMN whatsapp_opt_in INTEGER NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN courier TEXT;
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN cancel_reason TEXT;

-- Every WhatsApp message we attempt, for the admin audit trail and resends.
CREATE TABLE IF NOT EXISTS notifications (
  id           TEXT PRIMARY KEY,
  order_code   TEXT,
  message_id   TEXT,                 -- contact message id, when relevant
  recipient    TEXT NOT NULL,        -- international digits, e.g. 923001234567
  audience     TEXT NOT NULL,        -- 'customer' | 'admin'
  template     TEXT NOT NULL,
  body         TEXT NOT NULL,        -- rendered text, also used for manual resend
  status       TEXT NOT NULL,        -- 'sent' | 'failed' | 'skipped'
  provider_id  TEXT,                 -- WhatsApp message id (wamid.…)
  error        TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications (order_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_message ON notifications (message_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);

-- Contact form inbox.
CREATE TABLE IF NOT EXISTS messages (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT,
  topic            TEXT NOT NULL,
  order_code       TEXT,
  body             TEXT NOT NULL,
  whatsapp_opt_in  INTEGER NOT NULL DEFAULT 1,
  status           TEXT NOT NULL DEFAULT 'new',   -- 'new' | 'replied' | 'closed'
  created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_messages_status_created ON messages (status, created_at DESC);
