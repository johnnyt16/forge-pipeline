"use client";

import { useRouter, usePathname } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on login page
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
        border: "1px solid rgba(255,255,255,0.3)",
        color: "#fff",
        padding: "4px 12px",
        borderRadius: "4px",
        fontSize: "13px",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}
