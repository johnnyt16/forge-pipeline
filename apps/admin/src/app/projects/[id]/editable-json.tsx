"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EditableJsonProps {
  projectId: string;
  field: "extractedJson" | "generatedCopyJson" | "siteConfigJson";
  data: unknown;
}

export function EditableJson({ projectId, field, data }: EditableJsonProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(JSON.stringify(data, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const parsed = JSON.parse(value);

      const res = await fetch(`/api/projects/${projectId}/data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value: parsed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      setEditing(false);
      router.refresh();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON. Fix the syntax and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
          <button
            onClick={() => {
              setValue(JSON.stringify(data, null, 2));
              setEditing(true);
            }}
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "6px",
              cursor: "pointer",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Edit
          </button>
        </div>
        <pre style={preStyle}>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{ padding: "6px 10px", backgroundColor: "rgba(255,107,107,0.1)", color: "#FF6B6B", borderRadius: "6px", fontSize: "13px", marginBottom: "8px", border: "1px solid rgba(255,107,107,0.2)" }}>
          {error}
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          minHeight: "300px",
          padding: "12px",
          fontFamily: "monospace",
          fontSize: "12px",
          border: "2px solid #FF6B6B",
          borderRadius: "8px",
          resize: "vertical",
          boxSizing: "border-box",
          backgroundColor: "#121212",
          color: "#fafafa",
        }}
      />
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "6px 16px",
            fontSize: "13px",
            fontWeight: 600,
            backgroundColor: "#FF6B6B",
            color: "#121212",
            border: "none",
            borderRadius: "6px",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setError("");
          }}
          style={{
            padding: "6px 16px",
            fontSize: "13px",
            backgroundColor: "transparent",
            color: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const preStyle: React.CSSProperties = {
  backgroundColor: "#121212",
  padding: "14px",
  borderRadius: "8px",
  fontSize: "12px",
  overflow: "auto",
  maxHeight: "400px",
  border: "1px solid rgba(255,255,255,0.08)",
  margin: 0,
  color: "#fafafa",
};
