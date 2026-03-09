"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AssetInfo {
  id: string;
  filename: string;
  mimeType: string;
  purpose: string;
  createdAt: string;
}

export function BrandAssets({ siteId }: { siteId: string }) {
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [purpose, setPurpose] = useState("logo");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/sites/${siteId}/assets`);
      if (res.ok) setAssets(await res.json());
    } catch {
      // silently fail on load
    }
  }, [siteId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", purpose);

      const res = await fetch(`/api/sites/${siteId}/assets`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      await fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deleteAsset(assetId: string) {
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a.id !== assetId));
      }
    } catch {
      setError("Delete failed");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  return (
    <div style={{ backgroundColor: "#1a1a1a", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", marginBottom: "16px" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: "15px", color: "rgba(255,255,255,0.7)", fontFamily: '"Space Grotesk", sans-serif' }}>
        Brand Assets
      </h3>

      {error && (
        <div style={{ padding: "8px 12px", backgroundColor: "rgba(255,107,107,0.1)", color: "#FF6B6B", borderRadius: "8px", fontSize: "13px", marginBottom: "12px", border: "1px solid rgba(255,107,107,0.2)" }}>
          {error}
        </div>
      )}

      {/* Purpose selector + drop zone */}
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          style={{
            backgroundColor: "#121212",
            color: "#fafafa",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          <option value="logo">Logo</option>
          <option value="favicon">Favicon</option>
          <option value="general">General</option>
        </select>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            border: `2px dashed ${dragOver ? "#FF6B6B" : "rgba(255,255,255,0.12)"}`,
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
            cursor: uploading ? "wait" : "pointer",
            backgroundColor: dragOver ? "rgba(255,107,107,0.05)" : "transparent",
            transition: "all 0.15s",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
            {uploading
              ? "Uploading..."
              : "Drop an image here or click to browse"}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "4px" }}>
            PNG, JPEG, SVG, WebP, ICO — max 5MB
          </div>
        </div>
      </div>

      {/* Asset grid */}
      {assets.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" }}>
          {assets.map((asset) => (
            <div
              key={asset.id}
              style={{
                backgroundColor: "#121212",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "8px",
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/assets/${asset.id}`}
                alt={asset.filename}
                style={{
                  width: "100%",
                  height: "80px",
                  objectFit: "contain",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
              />
              <div style={{ marginTop: "6px", fontSize: "11px", color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {asset.filename}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
                {asset.purpose}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "rgba(239,68,68,0.8)",
                  color: "#fff",
                  fontSize: "12px",
                  lineHeight: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
                title="Delete"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {assets.length === 0 && (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 }}>
          No assets uploaded yet.
        </p>
      )}
    </div>
  );
}
