/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

export function SiteHeader({ config }: { config: Record<string, any> }) {
  const b = config.branding || {};
  const layout = config.layout || {};
  const primary = config.theme?.primaryColor || "#1a56db";
  const [menuOpen, setMenuOpen] = useState(false);

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

      {/* Hamburger toggle — visible on mobile only */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="menu-toggle"
        aria-label="Toggle menu"
        style={{
          display: "none",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          color: "#374151",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <div
        className={`site-nav ${menuOpen ? "open" : ""}`}
        style={{ display: "flex", gap: "24px", alignItems: "center", fontSize: "14px" }}
      >
        <a href="#services" style={{ color: "#374151", fontWeight: 500 }}>Services</a>
        {layout.showWhyChooseUs === true && (
          <a href="#why-us" style={{ color: "#374151", fontWeight: 500 }}>Why Us</a>
        )}
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
