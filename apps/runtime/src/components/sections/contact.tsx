"use client";

import { useState } from "react";

interface ContactSectionProps {
  config: Record<string, any>;
  siteId: string;
  showForm: boolean;
}

export function ContactSection({ config, siteId, showForm }: ContactSectionProps) {
  const c = config.contact || {};
  const b = config.branding || {};
  const primary = config.theme?.primaryColor || "#1a56db";

  return (
    <section
      id="contact"
      style={{
        padding: "80px 5%",
        background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`,
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>
          {c.title || "Get in Touch"}
        </h2>
        <p style={{ fontSize: "18px", opacity: 0.9, marginBottom: "32px", lineHeight: 1.5 }}>
          {c.subtitle || "Contact us today."}
        </p>

        {showForm ? (
          <ContactForm siteId={siteId} primary={primary} ctaText={c.ctaText} />
        ) : (
          <ContactInfo branding={b} primary={primary} ctaText={c.ctaText} />
        )}
      </div>
    </section>
  );
}

// Static contact info (for STATIC sites)
function ContactInfo({ branding, primary, ctaText }: { branding: any; primary: string; ctaText?: string }) {
  return (
    <>
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: "12px",
          padding: "32px",
        }}
      >
        {branding.phone && (
          <div style={{ marginBottom: "16px", fontSize: "22px" }}>
            <a href={`tel:${branding.phone}`} style={{ color: "#fff", fontWeight: 700 }}>{branding.phone}</a>
          </div>
        )}
        {branding.email && (
          <div style={{ marginBottom: "16px" }}>
            <a href={`mailto:${branding.email}`} style={{ color: "#fff", fontSize: "16px" }}>{branding.email}</a>
          </div>
        )}
        {branding.address && (
          <div style={{ marginBottom: "16px", opacity: 0.9, fontSize: "15px" }}>{branding.address}</div>
        )}
        {branding.officeHours && (
          <div style={{ opacity: 0.8, fontSize: "14px" }}>Hours: {branding.officeHours}</div>
        )}
      </div>
      <a
        href={branding.email ? `mailto:${branding.email}` : "#"}
        style={{
          display: "inline-block",
          marginTop: "28px",
          backgroundColor: "#fff",
          color: primary,
          padding: "14px 44px",
          borderRadius: "8px",
          fontWeight: 700,
          fontSize: "16px",
        }}
      >
        {ctaText || "Contact Us"}
      </a>
    </>
  );
}

// Interactive contact form (for STATIC_PLUS sites with contactForm feature)
function ContactForm({ siteId, primary, ctaText }: { siteId: string; primary: string; ctaText?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          formType: "contact",
          data: {
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone"),
            message: form.get("message"),
          },
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: "12px",
          padding: "40px",
          fontSize: "18px",
        }}
      >
        <strong>Thank you!</strong>
        <p style={{ marginTop: "8px", opacity: 0.9 }}>We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
      {error && (
        <div style={{ backgroundColor: "rgba(220,38,38,0.2)", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <input name="name" placeholder="Your name" required style={inputStyle} />
        <input name="email" type="email" placeholder="Email address" required style={inputStyle} />
      </div>
      <input name="phone" placeholder="Phone (optional)" style={{ ...inputStyle, marginBottom: "12px" }} />
      <textarea name="message" placeholder="How can we help?" rows={4} required style={{ ...inputStyle, marginBottom: "16px", resize: "vertical" }} />
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          backgroundColor: "#fff",
          color: primary,
          border: "none",
          borderRadius: "8px",
          fontWeight: 700,
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Sending..." : (ctaText || "Send Message")}
      </button>
    </form>
  );
}
