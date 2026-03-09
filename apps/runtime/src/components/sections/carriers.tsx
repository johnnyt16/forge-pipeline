export function CarriersSection({ config }: { config: Record<string, any> }) {
  const carriers = config.carriers || {};
  const items: string[] = carriers.items || [];

  if (items.length === 0) return null;

  const primary = config.theme?.primaryColor || "#1e3a5f";

  return (
    <section
      id="carriers"
      style={{
        padding: "32px 5%",
        backgroundColor: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {carriers.title && (
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase" as const,
              letterSpacing: "0.05em",
              color: "#9ca3af",
              marginBottom: "20px",
            }}
          >
            {carriers.title}
          </p>
        )}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap" as const,
            justifyContent: "center",
            gap: "12px",
          }}
        >
          {items.map((name: string, i: number) => (
            <span
              key={i}
              style={{
                padding: "8px 20px",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                color: primary,
                whiteSpace: "nowrap" as const,
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
