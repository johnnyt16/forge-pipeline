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
      // Layout section toggles
      layout: {
        showHero: form.get("sec_hero") === "on",
        showServices: form.get("sec_services") === "on",
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
      <h1>New Project</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "650px",
          backgroundColor: "#fff",
          padding: "24px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}
      >
        {error && (
          <div style={{ padding: "10px 14px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "6px", fontSize: "14px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* Basic Info */}
        <SectionLabel>Client Information</SectionLabel>
        <Field label="Client Name *">
          <input name="clientName" required placeholder="Acme Insurance" style={inputStyle} />
        </Field>
        <Field label="Contact Email *">
          <input name="contactEmail" type="email" required placeholder="contact@acmeinsurance.com" style={inputStyle} />
        </Field>

        {/* Input Mode */}
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
                border: inputMode === mode ? "2px solid #1a56db" : "1px solid #d1d5db",
                backgroundColor: inputMode === mode ? "#eff6ff" : "#fff",
                color: inputMode === mode ? "#1a56db" : "#374151",
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

        {/* Site Configuration */}
        <SectionLabel>Site Configuration</SectionLabel>
        <Field label="Site Type">
          <select name="siteType" style={inputStyle} defaultValue="STATIC">
            <option value="STATIC">Static Only — no backend features</option>
            <option value="STATIC_PLUS">Static + Backend — forms, lead capture</option>
          </select>
        </Field>
        <Field label="Template Family">
          <select name="templateFamily" style={inputStyle} defaultValue="INSURANCE_AGENCY">
            <option value="INSURANCE_AGENCY">Insurance Agency</option>
            <option value="LOCAL_SERVICE">Local Service Business</option>
            <option value="PROFESSIONAL_SERVICES">Professional Services</option>
          </select>
        </Field>

        {/* Feature Flags */}
        <SectionLabel>Backend Features</SectionLabel>
        <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "8px" }}>
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

        {/* Section Selection */}
        <SectionLabel>Sections to Include</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_hero" defaultChecked />
            Hero / Banner
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" name="sec_services" defaultChecked />
            Services
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

        {/* Notes */}
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
    <div style={{ fontSize: "13px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "20px", marginBottom: "12px", borderTop: "1px solid #f3f4f6", paddingTop: "16px" }}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "#374151" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
};

const submitButtonStyle = (loading: boolean): React.CSSProperties => ({
  backgroundColor: "#1a56db",
  color: "#fff",
  border: "none",
  padding: "10px 24px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: loading ? "not-allowed" : "pointer",
  opacity: loading ? 0.7 : 1,
});

const cancelButtonStyle: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  color: "#374151",
  border: "1px solid #d1d5db",
  padding: "10px 24px",
  borderRadius: "6px",
  fontSize: "14px",
  cursor: "pointer",
};
