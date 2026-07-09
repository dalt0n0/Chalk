"use client";

// Last-resort boundary: replaces the root layout, so it styles itself.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0c10",
          color: "#e8eaf0",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "0 16px",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Chalk hit an error</h1>
        <p style={{ color: "#97a0b3", maxWidth: 420, fontSize: 14 }}>
          The details are in the server log (journalctl -u chalk -e).
          {error.digest ? ` Digest: ${error.digest}` : ""}
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 16,
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            background: "#e8e3d8",
            color: "#000",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
