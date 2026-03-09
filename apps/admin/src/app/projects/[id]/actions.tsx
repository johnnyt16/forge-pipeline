"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ActionButtonsProps {
  projectId: string;
  status: string;
  hasScrapedPages: boolean;
  hasExtractedData: boolean;
  hasGeneratedCopy: boolean;
  hasSiteConfig: boolean;
}

type ActionType =
  | "scrape"
  | "extract"
  | "detect-missing"
  | "generate-copy"
  | "generate-config"
  | "approve"
  | "skip-missing"
  | "export";

const ACTION_LABELS: Record<ActionType, string> = {
  scrape: "Run Scrape",
  extract: "Run Extraction",
  "detect-missing": "Detect Missing Info",
  "generate-copy": "Generate Content",
  "generate-config": "Build Preview",
  approve: "Publish Live",
  "skip-missing": "Skip Missing → Generate",
  export: "Export Files",
};

const ACTION_COLORS: Record<ActionType, string> = {
  scrape: "#FF6B6B",
  extract: "#3b82f6",
  "detect-missing": "#8b5cf6",
  "generate-copy": "#7c3aed",
  "generate-config": "#10b981",
  approve: "#059669",
  "skip-missing": "#f59e0b",
  export: "#6366f1",
};

export function ActionButtons({
  projectId,
  status,
  hasScrapedPages,
  hasExtractedData,
  hasGeneratedCopy,
  hasSiteConfig,
}: ActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const actions: ActionType[] = [];

  switch (status) {
    case "CREATED":
      actions.push("scrape");
      break;
    case "EXTRACTED":
      actions.push("detect-missing");
      break;
    case "WAITING_FOR_MISSING_INFO":
      actions.push("skip-missing", "generate-copy");
      break;
    case "READY_TO_GENERATE":
      actions.push("generate-copy");
      break;
    case "PREVIEW_READY":
      actions.push("approve");
      break;
    case "SCRAPING":
    case "GENERATING":
      actions.push("scrape");
      break;
    case "FAILED":
      actions.push("scrape");
      break;
  }

  const rerunActions: ActionType[] = [];
  if (hasScrapedPages && !["CREATED", "SCRAPING"].includes(status)) {
    rerunActions.push("extract");
  }
  if (hasExtractedData && !["CREATED", "SCRAPING", "GENERATING"].includes(status)) {
    rerunActions.push("generate-copy");
  }
  if (hasGeneratedCopy && !["GENERATING"].includes(status)) {
    rerunActions.push("generate-config");
  }

  const rerunOnly = rerunActions.filter((a) => !actions.includes(a));

  async function runAction(action: ActionType, actionNotes?: string) {
    setLoading(action);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: actionNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      setShowNotes(false);
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "16px 20px",
        marginBottom: "16px",
      }}
    >
      <h3 style={{ margin: "0 0 12px", fontSize: "14px", color: "rgba(255,255,255,0.7)", fontFamily: '"Space Grotesk", sans-serif' }}>Pipeline Actions</h3>

      {error && (
        <div style={{ padding: "8px 12px", backgroundColor: "rgba(255,107,107,0.1)", color: "#FF6B6B", borderRadius: "8px", fontSize: "13px", marginBottom: "12px", border: "1px solid rgba(255,107,107,0.2)" }}>
          {error}
        </div>
      )}

      {actions.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: rerunOnly.length > 0 ? "12px" : 0 }}>
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => runAction(action)}
              disabled={loading !== null}
              style={actionButtonStyle(ACTION_COLORS[action], loading !== null)}
            >
              {loading === action ? "Running..." : ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      )}

      {rerunOnly.length > 0 && (
        <div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginBottom: "6px", marginTop: actions.length > 0 ? "4px" : 0 }}>
            Re-run:
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {rerunOnly.map((action) => (
              <button
                key={`rerun-${action}`}
                onClick={() => {
                  if (action === "generate-copy") {
                    setShowNotes(true);
                  } else {
                    runAction(action);
                  }
                }}
                disabled={loading !== null}
                style={actionButtonStyle("rgba(255,255,255,0.12)", loading !== null)}
              >
                {loading === action ? "Running..." : `Re-${ACTION_LABELS[action]}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {showNotes && (
        <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "rgba(255,255,255,0.7)" }}>
            Regeneration notes (optional — tell the AI what to change)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Make the headline more urgent. Add a testimonial about auto insurance. Tone down the FAQ section."
            style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", fontSize: "13px", resize: "vertical", boxSizing: "border-box", backgroundColor: "#121212", color: "#fafafa" }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={() => runAction("generate-copy", notes || undefined)}
              disabled={loading !== null}
              style={actionButtonStyle("#7c3aed", loading !== null)}
            >
              {loading === "generate-copy" ? "Regenerating..." : "Regenerate Content"}
            </button>
            <button
              onClick={() => { setShowNotes(false); setNotes(""); }}
              style={{ ...actionButtonStyle("transparent", false), border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {hasSiteConfig && (
        <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginBottom: "6px" }}>Static Export:</div>
          <button
            onClick={() => runAction("export")}
            disabled={loading !== null}
            style={actionButtonStyle(ACTION_COLORS.export, loading !== null)}
          >
            {loading === "export" ? "Exporting..." : "Export Files"}
          </button>
        </div>
      )}
    </div>
  );
}

function actionButtonStyle(bg: string, disabled: boolean): React.CSSProperties {
  return {
    backgroundColor: bg,
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}
