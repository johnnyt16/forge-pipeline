export function FaqSection({ config }: { config: Record<string, any> }) {
  const f = config.faq || {};
  const items = f.items || [];
  if (items.length === 0) return null;

  return (
    <section id="faq" style={{ padding: "80px 5%" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, textAlign: "center", marginBottom: "48px" }}>
          {f.title || "Frequently Asked Questions"}
        </h2>
        <div>
          {items.map((item: any, i: number) => (
            <div
              key={i}
              style={{
                padding: "20px 0",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#111827" }}>
                {item.question}
              </h3>
              <p style={{ fontSize: "15px", color: "#6b7280", lineHeight: 1.7 }}>
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
