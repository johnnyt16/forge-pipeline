const ICONS: Record<string, JSX.Element> = {
  shield: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  users: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  award: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
};

export function WhyChooseUsSection({ config }: { config: Record<string, any> }) {
  const section = config.whyChooseUs || {};
  const items: { title: string; description: string; icon?: string }[] = section.items || [];

  if (items.length === 0) return null;

  const primary = config.theme?.primaryColor || "#1e3a5f";

  return (
    <section
      id="why-us"
      style={{
        padding: "80px 5%",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "36px",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          {section.title || "Why Choose Us"}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#fff",
                padding: "32px 28px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  backgroundColor: `${primary}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  color: primary,
                }}
              >
                {ICONS[item.icon || "shield"] || ICONS.shield}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px" }}>
                {item.title}
              </h3>
              <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: 1.7 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
