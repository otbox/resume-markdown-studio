import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/layout/DashboardNav";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "0.75rem 0",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <Link href="/" style={{ fontWeight: 700, color: "#0d9488" }}>
              Resume AI Tailor
            </Link>
            <DashboardNav />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.875rem" }}>
            <span style={{ color: "#64748b" }}>{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="btn btn-secondary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}>
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
        {children}
      </main>
    </div>
  );
}
