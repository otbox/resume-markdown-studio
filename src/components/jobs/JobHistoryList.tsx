"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JobAnalysis } from "@/types/profile";

interface GeneratedResumeSummary {
  id: string;
  version: number;
  createdAt: string;
}

interface JobHistoryItem {
  id: string;
  title: string;
  company?: string | null;
  jobUrl?: string | null;
  createdAt: string;
  analysisJson: JobAnalysis | null;
  generatedResumes: GeneratedResumeSummary[];
}

interface JobHistoryListProps {
  limit?: number;
  title?: string;
  subtitle?: string;
  showNewJobButton?: boolean;
  showViewAllLink?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function matchBadge(score: number) {
  const bg = score >= 70 ? "#ccfbf1" : score >= 40 ? "#fef3c7" : "#fee2e2";
  const color = score >= 70 ? "#0f766e" : score >= 40 ? "#b45309" : "#b91c1c";
  return (
    <span className="badge" style={{ background: bg, color, fontWeight: 600 }}>
      {score}% match
    </span>
  );
}

export function JobHistoryList({
  limit,
  title,
  subtitle,
  showNewJobButton = false,
  showViewAllLink = false,
}: JobHistoryListProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/jobs/analyze");
    const data = await res.json();
    setJobs(res.ok ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRegenerate(jobId: string) {
    setGeneratingId(jobId);
    setError("");

    const res = await fetch("/api/resumes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobApplicationId: jobId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro ao gerar currículo");
      setGeneratingId(null);
      return;
    }

    router.push(`/studio/${data.resume.id}`);
  }

  const visibleJobs = limit ? jobs.slice(0, limit) : jobs;

  if (loading) {
    return <p style={{ color: "#64748b" }}>Carregando vagas...</p>;
  }

  return (
    <div>
      {(title || showNewJobButton || showViewAllLink) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            {title && <h2 style={{ margin: subtitle ? "0 0 0.5rem" : 0, fontSize: "1.25rem" }}>{title}</h2>}
            {subtitle && <p style={{ color: "#64748b", margin: 0 }}>{subtitle}</p>}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {showViewAllLink && (
              <Link href="/jobs" className="btn btn-secondary" style={{ fontSize: "0.875rem" }}>
                Ver todas
              </Link>
            )}
            {showNewJobButton && (
              <Link href="/jobs/new" className="btn btn-primary">
                Nova vaga
              </Link>
            )}
          </div>
        </div>
      )}

      {error && <p className="form-error" style={{ marginBottom: "1rem" }}>{error}</p>}

      {visibleJobs.length === 0 ? (
        <div className="card">
          <p style={{ margin: "0 0 1rem", color: "#64748b" }}>
            Nenhuma vaga registrada ainda.
          </p>
          <Link href="/jobs/new" className="btn btn-primary">
            Analisar primeira vaga
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {visibleJobs.map((job) => {
            const latestResume = job.generatedResumes[0];
            const matchScore = job.analysisJson?.matchScore;

            return (
              <div key={job.id} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.125rem" }}>{job.title}</h3>
                    {job.company && (
                      <p style={{ margin: "0 0 0.5rem", color: "#64748b", fontSize: "0.875rem" }}>
                        {job.company}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "#94a3b8" }}>
                      Analisada em {formatDate(job.createdAt)}
                    </p>
                    {latestResume && (
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#94a3b8" }}>
                        Último currículo: v{latestResume.version} · {formatDate(latestResume.createdAt)}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                      {typeof matchScore === "number" && matchBadge(matchScore)}
                      {job.jobUrl && (
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="badge badge-teal"
                          style={{ textDecoration: "none" }}
                        >
                          Link da vaga
                        </a>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      alignItems: "stretch",
                      minWidth: 180,
                    }}
                  >
                    <Link
                      href={`/jobs/${job.id}`}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.875rem", textAlign: "center" }}
                    >
                      Ver análise
                    </Link>
                    {latestResume && (
                      <Link
                        href={`/studio/${latestResume.id}`}
                        className="btn btn-secondary"
                        style={{ fontSize: "0.875rem", textAlign: "center" }}
                      >
                        Abrir currículo
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: "0.875rem" }}
                      disabled={generatingId === job.id}
                      onClick={() => handleRegenerate(job.id)}
                    >
                      {generatingId === job.id
                        ? "Gerando..."
                        : latestResume
                          ? "Gerar nova versão"
                          : "Gerar currículo"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
