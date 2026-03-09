import type { Metadata } from "next";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = {
  title: "Forge Pipeline — Admin",
  description: "Internal website production pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          padding: 0,
          backgroundColor: "#f5f5f5",
          color: "#111",
        }}
      >
        <header
          style={{
            backgroundColor: "#1a1a2e",
            color: "#fff",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            Forge Pipeline
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "13px", opacity: 0.7 }}>
              Internal Tool
            </span>
            <LogoutButton />
          </div>
        </header>
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
