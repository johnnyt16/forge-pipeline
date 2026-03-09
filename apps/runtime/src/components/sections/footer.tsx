export function FooterSection({ config }: { config: Record<string, any> }) {
  const f = config.footer || {};
  const b = config.branding || {};
  const layout = config.layout || {};

  return (
    <footer
      style={{
        backgroundColor: "#111827",
        color: "#d1d5db",
        padding: "48px 5% 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "32px",
          marginBottom: "32px",
        }}
      >
        <div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>
            {f.businessName || b.businessName || "Business"}
          </div>
          {f.tagline && (
            <p style={{ fontSize: "14px", lineHeight: 1.6 }}>{f.tagline}</p>
          )}
        </div>

        <div>
          <div style={{ fontWeight: 600, color: "#fff", marginBottom: "14px", fontSize: "14px" }}>Quick Links</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <a href="#services" style={{ color: "#d1d5db" }}>Services</a>
            {layout.showWhyChooseUs === true && (
              <a href="#why-us" style={{ color: "#d1d5db" }}>Why Us</a>
            )}
            <a href="#about" style={{ color: "#d1d5db" }}>About</a>
            <a href="#testimonials" style={{ color: "#d1d5db" }}>Testimonials</a>
            <a href="#faq" style={{ color: "#d1d5db" }}>FAQ</a>
            <a href="#contact" style={{ color: "#d1d5db" }}>Contact</a>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 600, color: "#fff", marginBottom: "14px", fontSize: "14px" }}>Contact</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            {(f.phone || b.phone) && <span>{f.phone || b.phone}</span>}
            {(f.email || b.email) && <span>{f.email || b.email}</span>}
            {(f.address || b.address) && <span>{f.address || b.address}</span>}
            {b.officeHours && <span>{b.officeHours}</span>}
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #374151",
          paddingTop: "20px",
          textAlign: "center",
          fontSize: "13px",
          color: "#6b7280",
        }}
      >
        {f.copyright || `\u00A9 ${new Date().getFullYear()} ${f.businessName || b.businessName || "Business"}. All rights reserved.`}
      </div>
    </footer>
  );
}
