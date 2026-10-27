"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { JobAnalysis } from "@/types/profile";

interface JobApp {
  id: string;
  title: string;
  company?: string | null;
  jobUrl?: string | null;
  rawJobText: string;
  analysisJson: JobAnalysis;
  generatedResumes?: { id: string; version: number; createdAt: string }[];
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/jobs/analyze");
    const jobs = await res.json();
    const found = jobs.find((j: JobApp) => j.id === id);
    setJob(found ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");

    const res = await fetch("/api/resumes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobApplicationId: id }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro ao gerar currículo");
      setGenerating(false);
      return;
    }

    router.push(`/studio/${data.resume.id}`);
  }

  if (loading) return <p>Carregando...</p>;
  if (!job) return <p>Vaga não encontrada.</p>;

  const analysis = job.analysisJson;
  const latestResume = job.generatedResumes?.[0];

  return (
    <div style={{ maxWidth: 900 }}>
      <p style={{ margin: "0 0 1rem", fontSize: "0.875rem" }}>
        <Link href="/jobs" style={{ color: "#0d9488" }}>← Voltar ao histórico</Link>
      </p>
      <h1 style={{ margin: "0 0 0.25rem" }}>{job.title}</h1>
      {job.company && <p style={{ color: "#64748b", margin: "0 0 0.25rem" }}>{job.company}</p>}
      {job.jobUrl && (
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem" }}>
          <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0d9488" }}>
            Ver vaga original
          </a>
        </p>
      )}
      {!job.jobUrl && <div style={{ marginBottom: "1.5rem" }} />}

      <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: analysis.matchScore >= 70 ? "#ccfbf1" : analysis.matchScore >= 40 ? "#fef3c7" : "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: analysis.matchScore >= 70 ? "#0f766e" : analysis.matchScore >= 40 ? "#b45309" : "#b91c1c",
              }}
            >
              {analysis.matchScore}%
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Match com seu perfil</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                {analysis.matchScore >= 70 ? "Ótimo match!" : analysis.matchScore >= 40 ? "Match parcial" : "Match baixo — considere adicionar experiências"}
              </p>
            </div>
          </div>
        </div>

        {analysis.requiredSkills.length > 0 && (
          <div className="card">
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Skills requeridas</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {analysis.requiredSkills.map((s) => (
                <span key={s} className="badge badge-teal">{s}</span>
              ))}
            </div>
          </div>
        )}

        {analysis.gaps.length > 0 && (
          <div className="card">
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Gaps identificados</h3>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
              {analysis.gaps.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </div>
        )}

        {analysis.recommendations.length > 0 && (
          <div className="card">
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Recomendações</h3>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
              {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {latestResume && (
          <Link href={`/studio/${latestResume.id}`} className="btn btn-secondary">
            Abrir currículo (v{latestResume.version})
          </Link>
        )}
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating
            ? "Gerando currículo adaptado..."
            : latestResume
              ? "Gerar nova versão"
              : "Gerar currículo adaptado"}
        </button>
      </div>
    </div>
  );
}
