export function TestimonialsSection({ config }: { config: Record<string, any> }) {
  const t = config.testimonials || {};
  const items = t.items || [];
  if (items.length === 0) return null;

  return (
    <section id="testimonials" style={{ padding: "80px 5%", backgroundColor: "#f9fafb" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, textAlign: "center", marginBottom: "48px" }}>
          {t.title || "What Our Clients Say"}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
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
              <div style={{ fontSize: "32px", color: "#d1d5db", marginBottom: "12px" }}>&ldquo;</div>
              <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#374151", marginBottom: "20px" }}>
                {item.text}
              </p>
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "12px" }}>
                <strong style={{ fontSize: "14px" }}>{item.author}</strong>
                {item.role && (
                  <span style={{ display: "block", fontSize: "13px", color: "#9ca3af" }}>{item.role}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
