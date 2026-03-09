export function HeroSection({ config }: { config: Record<string, any> }) {
  const h = config.hero || {};
  const primary = config.theme?.primaryColor || "#1a56db";

  return (
    <section
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%)`,
        color: "#fff",
        padding: "100px 5% 80px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, marginBottom: "20px", lineHeight: 1.1 }}>
          {h.headline || "Welcome"}
        </h1>
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", opacity: 0.9, marginBottom: "36px", lineHeight: 1.6 }}>
          {h.subheadline || ""}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="#contact"
            style={{
              backgroundColor: "#fff",
              color: primary,
              padding: "14px 36px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            {h.ctaText || "Get Started"}
          </a>
          {h.ctaSecondaryText && (
            <a
              href="#services"
              style={{
                backgroundColor: "transparent",
                color: "#fff",
                padding: "14px 36px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "16px",
                border: "2px solid rgba(255,255,255,0.4)",
              }}
            >
              {h.ctaSecondaryText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
