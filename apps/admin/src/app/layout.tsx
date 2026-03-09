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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          margin: 0,
          padding: 0,
          backgroundColor: "#121212",
          color: "#fafafa",
        }}
      >
        <header
          style={{
            backgroundColor: "rgba(18, 18, 18, 0.8)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
            padding: "0 24px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <a
            href="/"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontSize: "18px",
              fontWeight: 700,
              fontFamily: '"Space Grotesk", sans-serif',
              letterSpacing: "-0.02em",
            }}
          >
            Forge Pipeline
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              Admin
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
