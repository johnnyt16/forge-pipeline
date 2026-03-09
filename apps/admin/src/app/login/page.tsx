"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          padding: "40px",
          border: "1px solid rgba(255,255,255,0.08)",
          width: "100%",
          maxWidth: "380px",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "24px",
            fontWeight: 700,
            fontFamily: '"Space Grotesk", sans-serif',
            color: "#fafafa",
            letterSpacing: "-0.02em",
          }}
        >
          Admin Login
        </h1>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          Enter the admin password to continue.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          autoFocus
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: "15px",
            backgroundColor: "#121212",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            boxSizing: "border-box",
            outline: "none",
            color: "#fafafa",
          }}
        />

        {error && (
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "14px",
              color: "#FF6B6B",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            fontSize: "15px",
            fontWeight: 600,
            color: "#121212",
            backgroundColor: "#FF6B6B",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
