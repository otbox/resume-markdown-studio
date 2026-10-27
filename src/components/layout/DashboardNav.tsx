"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Início", match: (path: string) => path === "/dashboard" },
  { href: "/profile", label: "Perfil", match: (path: string) => path.startsWith("/profile") },
  { href: "/experiences", label: "Experiências", match: (path: string) => path.startsWith("/experiences") },
  { href: "/jobs/new", label: "Nova vaga", match: (path: string) => path === "/jobs/new" },
  { href: "/jobs", label: "Histórico", match: (path: string) => path === "/jobs" || (path.startsWith("/jobs/") && path !== "/jobs/new") },
  { href: "/preferences", label: "Preferências", match: (path: string) => path.startsWith("/preferences") },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", gap: "1.25rem", fontSize: "0.875rem", flexWrap: "wrap" }}>
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              color: active ? "#0d9488" : "#475569",
              fontWeight: active ? 600 : 500,
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
