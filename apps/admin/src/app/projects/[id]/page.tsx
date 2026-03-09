import { prisma, getSitesDir } from "@forge/core";
import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { ActionButtons } from "./actions";
import { EditableJson } from "./editable-json";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  CREATED: "#6b7280",
  SCRAPING: "#f59e0b",
  EXTRACTED: "#3b82f6",
  WAITING_FOR_MISSING_INFO: "#ef4444",
  READY_TO_GENERATE: "#8b5cf6",
  GENERATING: "#f59e0b",
  PREVIEW_READY: "#10b981",
  APPROVED: "#059669",
  DEPLOYED: "#047857",
  FAILED: "#dc2626",
};

const SITE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6b7280",
  PREVIEW: "#f59e0b",
  LIVE: "#10b981",
  PAUSED: "#ef4444",
  ARCHIVED: "#9ca3af",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      scrapedPages: { orderBy: { createdAt: "asc" } },
      projectData: true,
      site: {
        include: {
          domains: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!project) notFound();

  const data = project.projectData;
  const site = project.site;

  const runtimeUrl = process.env.RUNTIME_URL || "http://localhost:3001";
  const previewUrl = site ? `${runtimeUrl}/preview/${site.slug}` : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <Link href="/" style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textDecoration: "none" }}>
            ← Back to Projects
          </Link>
          <h1 style={{ margin: "8px 0 4px", fontFamily: '"Space Grotesk", sans-serif', letterSpacing: "-0.02em" }}>{project.clientName}</h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "14px", color: "rgba(255,255,255,0.45)", flexWrap: "wrap" }}>
            {project.websiteUrl && (
              <>
                <a href={project.websiteUrl} target="_blank" rel="noopener" style={{ color: "#FF6B6B" }}>
                  {project.websiteUrl}
                </a>
                <span>·</span>
              </>
            )}
            <span>{project.contactEmail}</span>
            {!project.websiteUrl && <span style={{ color: "#f59e0b" }}>· Manual input</span>}
          </div>
        </div>
        <StatusBadge label={project.status.replace(/_/g, " ")} color={STATUS_COLORS[project.status]} />
      </div>

      {/* Site Info */}
      {site && (
        <Section title="Site">
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "14px" }}>
            <div><strong>Slug:</strong> {site.slug}</div>
            <div><strong>Type:</strong> {site.siteType}</div>
            <div><strong>Template:</strong> {site.templateFamily.replace(/_/g, " ")}</div>
            <div>
              <strong>Status: </strong>
              <StatusBadge label={site.status} color={SITE_STATUS_COLORS[site.status]} />
            </div>
          </div>
          {site.notes && (
            <p style={{ marginTop: "8px", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>Notes: {site.notes}</p>
          )}
          <div style={{ marginTop: "12px" }}>
            <strong style={{ fontSize: "13px" }}>Features: </strong>
            {Object.entries(site.features as Record<string, boolean>).map(([key, val]) => (
              <span key={key} style={{ display: "inline-block", margin: "2px 4px", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", backgroundColor: val ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", color: val ? "#10b981" : "rgba(255,255,255,0.3)" }}>
                {key}: {val ? "on" : "off"}
              </span>
            ))}
          </div>
          {site.domains.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <strong style={{ fontSize: "13px" }}>Domains: </strong>
              {site.domains.map((d) => (
                <span key={d.id} style={{ fontSize: "13px", marginRight: "12px" }}>
                  {d.hostname} {d.isPrimary && "(primary)"} {!d.verified && "(unverified)"}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Action Buttons */}
      <ActionButtons
        projectId={project.id}
        status={project.status}
        hasScrapedPages={project.scrapedPages.length > 0}
        hasExtractedData={!!data?.extractedJson}
        hasGeneratedCopy={!!data?.generatedCopyJson}
        hasSiteConfig={!!data?.siteConfigJson}
      />

      {/* Preview Link */}
      {previewUrl && (data?.siteConfigJson) && (
        <Section title="Preview">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener"
            style={{ display: "inline-block", padding: "10px 20px", backgroundColor: "#10b981", color: "#fff", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}
          >
            Open Preview →
          </a>
          <span style={{ marginLeft: "12px", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>{previewUrl}</span>
        </Section>
      )}

      {/* Static Files Status */}
      {site && <StaticFilesStatus slug={site.slug} />}

      {/* Scraped Pages */}
      <Section title={`Scraped Pages (${project.scrapedPages.length})`}>
        {project.scrapedPages.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>No pages scraped yet.</p>
        ) : (
          <div>
            {project.scrapedPages.map((page) => (
              <div key={page.id} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "14px" }}>
                <strong>{page.title || "(no title)"}</strong>
                {page.url !== "manual-input" ? (
                  <>
                    <br />
                    <a href={page.url} target="_blank" rel="noopener" style={{ color: "#FF6B6B", fontSize: "13px" }}>{page.url}</a>
                  </>
                ) : (
                  <span style={{ fontSize: "12px", color: "#f59e0b", marginLeft: "8px" }}>(manual input)</span>
                )}
                <br />
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>{page.rawContent.length.toLocaleString()} chars</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Extracted Data */}
      {data?.extractedJson && (
        <Section title="Extracted Business Data">
          <EditableJson
            projectId={project.id}
            field="extractedJson"
            data={data.extractedJson}
          />
        </Section>
      )}

      {/* Missing Fields */}
      {data?.missingFieldsJson && (
        <Section title="Missing Information">
          <MissingFieldsList fields={data.missingFieldsJson as unknown as MissingField[]} />
        </Section>
      )}

      {/* Generated Copy */}
      {data?.generatedCopyJson && (
        <Section title="Generated Copy">
          <EditableJson
            projectId={project.id}
            field="generatedCopyJson"
            data={data.generatedCopyJson}
          />
        </Section>
      )}

      {/* Site Config */}
      {data?.siteConfigJson && (
        <Section title="Site Config">
          <EditableJson
            projectId={project.id}
            field="siteConfigJson"
            data={data.siteConfigJson}
          />
        </Section>
      )}
    </div>
  );
}

// -- Helper components --

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#1a1a1a", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", marginBottom: "16px" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: "15px", color: "rgba(255,255,255,0.7)", fontFamily: '"Space Grotesk", sans-serif' }}>{title}</h3>
      {children}
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, color: "#fff", backgroundColor: color }}>
      {label}
    </span>
  );
}

function StaticFilesStatus({ slug }: { slug: string }) {
  let hasStaticFiles = false;
  let lastModified: Date | null = null;
  try {
    const sitesDir = getSitesDir();
    const indexPath = path.join(sitesDir, slug, "index.html");
    if (fs.existsSync(indexPath)) {
      hasStaticFiles = true;
      lastModified = fs.statSync(indexPath).mtime;
    }
  } catch {
    // ignore filesystem errors
  }

  return (
    <Section title="Static Files">
      {hasStaticFiles ? (
        <div style={{ fontSize: "14px" }}>
          <span style={{ color: "#10b981", fontWeight: 600 }}>Exported</span>
          {lastModified && (
            <span style={{ marginLeft: "12px", color: "rgba(255,255,255,0.4)" }}>
              Last built: {lastModified.toLocaleString()}
            </span>
          )}
          <div style={{ marginTop: "8px", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
            Path: sites/{slug}/
          </div>
        </div>
      ) : (
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
          No static files exported yet. Use &quot;Export Files&quot; to generate.
        </p>
      )}
    </Section>
  );
}

interface MissingField {
  field: string;
  label: string;
  severity: "critical" | "recommended" | "optional";
  reason: string;
}

function MissingFieldsList({ fields }: { fields: MissingField[] }) {
  const severityColors = { critical: "#FF6B6B", recommended: "#f59e0b", optional: "rgba(255,255,255,0.4)" };
  return (
    <div>
      {fields.map((f) => (
        <div key={f.field} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: severityColors[f.severity], textTransform: "uppercase", minWidth: "90px" }}>{f.severity}</span>
          <span><strong>{f.label}</strong> — {f.reason}</span>
        </div>
      ))}
    </div>
  );
}
