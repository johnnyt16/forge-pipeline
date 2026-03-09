/* eslint-disable @next/next/no-img-element */

export function SiteHeader({ config }: { config: Record<string, any> }) {
  const b = config.branding || {};
  const primary = config.theme?.primaryColor || "#1a56db";

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 5%",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "20px", color: primary }}>
        {b.logoUrl ? (
          <img src={b.logoUrl} alt={b.businessName} style={{ height: "40px" }} />
        ) : (
          b.businessName || "Business"
        )}
      </div>
      <div className="hide-mobile" style={{ display: "flex", gap: "24px", alignItems: "center", fontSize: "14px" }}>
        <a href="#services" style={{ color: "#374151", fontWeight: 500 }}>Services</a>
        <a href="#about" style={{ color: "#374151", fontWeight: 500 }}>About</a>
        <a href="#testimonials" style={{ color: "#374151", fontWeight: 500 }}>Testimonials</a>
        <a href="#contact" style={{ color: "#374151", fontWeight: 500 }}>Contact</a>
        {b.phone && (
          <a
            href={`tel:${b.phone}`}
            style={{
              backgroundColor: primary,
              color: "#fff",
              padding: "8px 18px",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {b.phone}
          </a>
        )}
      </div>
    </nav>
  );
}
