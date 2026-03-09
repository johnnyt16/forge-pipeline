export function AboutSection({ config }: { config: Record<string, any> }) {
  const a = config.about || {};
  const primary = config.theme?.primaryColor || "#1a56db";

  return (
    <section id="about" style={{ padding: "80px 5%" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, textAlign: "center", marginBottom: "24px" }}>
          {a.title || "About Us"}
        </h2>
        <p style={{ fontSize: "16px", lineHeight: 1.8, color: "#4b5563", textAlign: "center", whiteSpace: "pre-line" }}>
          {a.description || ""}
        </p>
        {a.highlights?.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginTop: "40px",
            }}
          >
            {a.highlights.map((h: string, i: number) => (
              <div
                key={i}
                style={{
                  padding: "16px 20px",
                  backgroundColor: `${primary}08`,
                  borderRadius: "8px",
                  borderLeft: `4px solid ${primary}`,
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                {h}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
