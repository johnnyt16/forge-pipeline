export function ServicesSection({ config }: { config: Record<string, any> }) {
  const s = config.services || {};
  const items = s.items || [];
  const primary = config.theme?.primaryColor || "#1a56db";

  return (
    <section id="services" style={{ padding: "80px 5%", backgroundColor: "#f9fafb" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, textAlign: "center", marginBottom: "8px" }}>
          {s.title || "Our Services"}
        </h2>
        {s.subtitle && (
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "18px", marginBottom: "48px" }}>
            {s.subtitle}
          </p>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            marginTop: "32px",
          }}
        >
          {items.map((item: any, i: number) => (
            <div
              key={i}
              style={{
                backgroundColor: "#fff",
                padding: "28px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: `${primary}12`,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                  color: primary,
                  fontWeight: 700,
                  fontSize: "18px",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>{item.name}</h3>
              <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: 1.7 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
