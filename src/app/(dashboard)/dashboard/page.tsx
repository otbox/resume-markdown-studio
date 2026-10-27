import Link from "next/link";
import { requireUser, getProfileForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecentJobsSection } from "@/components/jobs/RecentJobsSection";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);

  const jobCount = profile
    ? await prisma.jobApplication.count({ where: { profileId: profile.id } })
    : 0;
  const resumeCount = profile
    ? await prisma.generatedResume.count({ where: { profileId: profile.id } })
    : 0;

  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem" }}>Olá{profile ? `, ${profile.fullName.split(" ")[0]}` : ""}!</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Gere currículos adaptados para cada vaga usando seu perfil e IA.
      </p>

      {!profile ? (
        <div className="card" style={{ maxWidth: 600 }}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.125rem" }}>Configure seu perfil</h2>
          <p style={{ color: "#64748b", marginBottom: "1rem" }}>
            Importe seu currículo em PDF ou preencha manualmente para começar.
          </p>
          <Link href="/profile?onboarding=1" className="btn btn-primary">
            Configurar perfil
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div className="card">
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>Experiências</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "1.75rem", fontWeight: 700 }}>{profile.experiences.length}</p>
          </div>
          <div className="card">
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>Vagas analisadas</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "1.75rem", fontWeight: 700 }}>{jobCount}</p>
          </div>
          <div className="card">
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>Currículos gerados</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "1.75rem", fontWeight: 700 }}>{resumeCount}</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/profile" className="btn btn-secondary">Editar perfil</Link>
        <Link href="/jobs" className="btn btn-secondary">Histórico de vagas</Link>
        <Link href="/jobs/new" className="btn btn-primary">Analisar nova vaga</Link>
      </div>

      {profile && (
        <section style={{ marginTop: "2.5rem", maxWidth: 960 }}>
          <RecentJobsSection />
        </section>
      )}
    </div>
  );
}
