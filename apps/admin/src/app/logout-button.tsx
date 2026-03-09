"use client";

import { useRouter, usePathname } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "none",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "rgba(255,255,255,0.6)",
        padding: "5px 14px",
        borderRadius: "6px",
        fontSize: "13px",
        cursor: "pointer",
        transition: "border-color 0.15s, color 0.15s",
      }}
    >
      Logout
    </button>
  );
}
