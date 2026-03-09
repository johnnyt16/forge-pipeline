"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EditableJsonProps {
  projectId: string;
  field: "extractedJson" | "generatedCopyJson" | "siteConfigJson";
  data: unknown;
}

/**
 * Displays JSON data with an edit toggle.
 * In edit mode, shows a textarea where you can modify the JSON and save.
 */
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
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              cursor: "pointer",
              color: "#374151",
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
        <div style={{ padding: "6px 10px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "4px", fontSize: "13px", marginBottom: "8px" }}>
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
          border: "2px solid #3b82f6",
          borderRadius: "6px",
          resize: "vertical",
          boxSizing: "border-box",
          backgroundColor: "#f8fafc",
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
            backgroundColor: "#1a56db",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
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
            backgroundColor: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
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
  backgroundColor: "#f9fafb",
  padding: "14px",
  borderRadius: "6px",
  fontSize: "12px",
  overflow: "auto",
  maxHeight: "400px",
  border: "1px solid #e5e7eb",
  margin: 0,
};
