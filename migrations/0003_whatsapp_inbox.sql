-- Two-way WhatsApp: customer service windows, inbound messages, delivery receipts.

-- One row per WhatsApp user who has messaged the store. A message from them
-- opens a free 24-hour "customer service window" for replies.
CREATE TABLE IF NOT EXISTS wa_contacts (
  wa_id              TEXT PRIMARY KEY,          -- international digits, e.g. 923001234567
  name               TEXT,                      -- WhatsApp profile name
  last_inbound_at    INTEGER NOT NULL,          -- unix seconds of their latest message
  last_bot_reply_at  INTEGER,                   -- throttles generic auto-replies
  bot_paused_until   INTEGER,                   -- set when they ask for a human
  updated_at         INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Every inbound message (id = WhatsApp's wamid, so webhook retries are ignored).
CREATE TABLE IF NOT EXISTS wa_inbound (
  id          TEXT PRIMARY KEY,
  wa_id       TEXT NOT NULL,
  type        TEXT NOT NULL,                    -- text | image | document | interactive | button | other
  text        TEXT,
  media_id    TEXT,
  order_code  TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_wa_inbound_wa ON wa_inbound (wa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_inbound_order ON wa_inbound (order_code, created_at DESC);

-- Outbound bookkeeping: how a message was sent and its delivery receipt.
ALTER TABLE notifications ADD COLUMN kind TEXT NOT NULL DEFAULT 'template';   -- template | text
ALTER TABLE notifications ADD COLUMN delivery TEXT;                            -- sent | delivered | read | failed
CREATE INDEX IF NOT EXISTS idx_notifications_provider ON notifications (provider_id);
