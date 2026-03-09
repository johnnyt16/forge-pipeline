"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState<"url" | "manual" | "both">("url");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const features: Record<string, unknown> = {
      contactForm: form.get("feat_contactForm") === "on",
      quoteRequest: form.get("feat_quoteRequest") === "on",
      leadCapture: form.get("feat_leadCapture") === "on",
      layout: {
        showHero: form.get("sec_hero") === "on",
        showCarriers: form.get("sec_carriers") === "on",
        showServices: form.get("sec_services") === "on",
        showWhyChooseUs: form.get("sec_whyChooseUs") === "on",
        showAbout: form.get("sec_about") === "on",
        showTestimonials: form.get("sec_testimonials") === "on",
        showFaq: form.get("sec_faq") === "on",
        showContact: form.get("sec_contact") === "on",
        showFooter: form.get("sec_footer") === "on",
      },
    };

    const websiteUrl = form.get("websiteUrl") as string;
    const rawContent = form.get("rawContent") as string;

    if (!websiteUrl && !rawContent) {
      setError("Provide either a website URL to scrape or paste some content manually.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.get("clientName"),
          websiteUrl: websiteUrl || undefined,
          contactEmail: form.get("contactEmail"),
          rawContent: rawContent || undefined,
          siteType: form.get("siteType"),
          templateFamily: form.get("templateFamily"),
          features,
          notes: form.get("notes") || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', letterSpacing: "-0.02em" }}>New Project</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "650px",
          backgroundColor: "#1a1a1a",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {error && (
          <div style={{ padding: "10px 14px", backgroundColor: "rgba(255,107,107,0.1)", color: "#FF6B6B", borderRadius: "8px", fontSize: "14px", marginBottom: "16px", border: "1px solid rgba(255,107,107,0.2)" }}>
            {error}
          </div>
        )}

        <SectionLabel>Client Information</SectionLabel>
        <Field label="Client Name *">
          <input name="clientName" required placeholder="Acme Insurance" style={inputStyle} />
        </Field>
        <Field label="Contact Email *">
          <input name="contactEmail" type="email" required placeholder="contact@acmeinsurance.com" style={inputStyle} />
        </Field>

        <SectionLabel>Content Source</SectionLabel>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {(["url", "manual", "both"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setInputMode(mode)}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: inputMode === mode ? "2px solid #FF6B6B" : "1px solid rgba(255,255,255,0.12)",
                backgroundColor: inputMode === mode ? "rgba(255,107,107,0.1)" : "transparent",
                color: inputMode === mode ? "#FF6B6B" : "rgba(255,255,255,0.6)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {mode === "url" ? "Scrape URL" : mode === "manual" ? "Paste Content" : "Both"}
            </button>
          ))}
        </div>

        {(inputMode === "url" || inputMode === "both") && (
          <Field label={`Website URL ${inputMode === "url" ? "*" : "(optional)"}`}>
            <input
              name="websiteUrl"
              type="url"
              required={inputMode === "url"}
              placeholder="https://acmeinsurance.com"
              style={inputStyle}
            />
          </Field>
        )}

        {(inputMode === "manual" || inputMode === "both") && (
          <Field label={`Business Information ${inputMode === "manual" ? "*" : "(optional)"}`}>
            <textarea
              name="rawContent"
              rows={8}
              required={inputMode === "manual"}
              placeholder={"Paste any information about the business here.\n\nExamples:\n- Business name, address, phone\n- Services they offer\n- About the business\n- Testimonials\n- Office hours\n- Team members\n- Anything else relevant\n\nCan be unstructured — the AI will extract what it needs."}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: "13px" }}
            />
          </Field>
        )}

        <SectionLabel>Site Configuration</SectionLabel>
        <Field label="Site Type">
          <select name="siteType" style={selectStyle} defaultValue="STATIC">
            <option value="STATIC">Static Only — no backend features</option>
            <option value="STATIC_PLUS">Static + Backend — forms, lead capture</option>
          </select>
        </Field>
        <Field label="Template Family">
          <select name="templateFamily" style={selectStyle} defaultValue="INSURANCE_AGENCY">
            <option value="INSURANCE_AGENCY">Insurance Agency</option>
            <option value="LOCAL_SERVICE">Local Service Business</option>
            <option value="PROFESSIONAL_SERVICES">Professional Services</option>
          </select>
        </Field>

        <SectionLabel>Backend Features</SectionLabel>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>
          Only applies to &quot;Static + Backend&quot; sites
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          <label style={checkboxLabel}>
            <input type="checkbox" name="feat_contactForm" defaultChecked />
            Contact Form
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="feat_quoteRequest" />
            Quote Request Form
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="feat_leadCapture" />
            Lead Capture
          </label>
        </div>

        <SectionLabel>Sections to Include</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_hero" defaultChecked />
            Hero / Banner
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_carriers" />
            Carriers Trust Bar
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_services" defaultChecked />
            Services
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_whyChooseUs" />
            Why Choose Us
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_about" defaultChecked />
            About
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_testimonials" defaultChecked />
            Testimonials
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_faq" defaultChecked />
            FAQ
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_contact" defaultChecked />
            Contact
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_footer" defaultChecked />
            Footer
          </label>
        </div>

        <Field label="Notes (optional)">
          <textarea
            name="notes"
            rows={3}
            placeholder="Special requirements, integrations, design preferences, etc."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button type="submit" disabled={loading} style={submitButtonStyle(loading)}>
            {loading ? "Creating..." : "Create Project"}
          </button>
          <button type="button" onClick={() => router.back()} style={cancelButtonStyle}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "20px", marginBottom: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "rgba(255,255,255,0.7)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
  backgroundColor: "#121212",
  color: "#fafafa",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  paddingRight: "32px",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  cursor: "pointer",
};

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
  color: "rgba(255,255,255,0.7)",
};

const submitButtonStyle = (loading: boolean): React.CSSProperties => ({
  backgroundColor: "#FF6B6B",
  color: "#121212",
  border: "none",
  padding: "10px 24px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: loading ? "not-allowed" : "pointer",
  opacity: loading ? 0.7 : 1,
});

const cancelButtonStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "rgba(255,255,255,0.6)",
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "10px 24px",
  borderRadius: "8px",
  fontSize: "14px",
  cursor: "pointer",
};
