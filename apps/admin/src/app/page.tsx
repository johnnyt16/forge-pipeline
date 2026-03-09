import { prisma } from "@forge/core";
import Link from "next/link";

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

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      site: true,
      _count: { select: { scrapedPages: true } },
    },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ margin: 0 }}>Projects</h1>
        <Link
          href="/projects/new"
          style={{ backgroundColor: "#1a56db", color: "#fff", padding: "10px 20px", borderRadius: "6px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "16px", color: "#6b7280" }}>No projects yet. Create your first project to get started.</p>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Pipeline</th>
              <th style={thStyle}>Site</th>
              <th style={thStyle}>Pages</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={tdStyle}>
                  <strong>{project.clientName}</strong>
                  <br />
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>{project.site?.slug || "—"}</span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {project.site?.siteType === "STATIC_PLUS" ? "Static+" : "Static"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, color: "#fff", backgroundColor: STATUS_COLORS[project.status] || "#6b7280" }}>
                    {project.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: "12px", color: project.site?.status === "LIVE" ? "#059669" : "#6b7280" }}>
                    {project.site?.status || "—"}
                  </span>
                </td>
                <td style={tdStyle}>{project._count.scrapedPages}</td>
                <td style={{ ...tdStyle, fontSize: "13px", color: "#6b7280" }}>
                  {project.createdAt.toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  <Link href={`/projects/${project.id}`} style={{ color: "#1a56db", textDecoration: "none", fontWeight: 600, fontSize: "13px" }}>
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 16px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "14px",
};
