"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-PK">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f6f5f1", color: "#0a0a0a", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Something went wrong.</h1>
          <p style={{ color: "#6a6a66" }}>Please refresh the page or try again in a moment.</p>
          <button onClick={reset} style={{ marginTop: 12, padding: "10px 18px", background: "#151515", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
