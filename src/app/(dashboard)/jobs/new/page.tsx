"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewJobPage() {
  const router = useRouter();
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [importedFromUrl, setImportedFromUrl] = useState(false);

  async function handleImportUrl() {
    if (!jobUrl.trim()) return;
    setImporting(true);
    setError("");

    const res = await fetch("/api/jobs/fetch-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: jobUrl.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro ao importar URL");
      setImporting(false);
      return;
    }

    setTitle(data.title ?? "");
    setCompany(data.company ?? "");
    setJobText(data.jobText ?? "");
    setImportedFromUrl(true);
    setImporting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/jobs/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobText,
        jobUrl: jobUrl.trim() || undefined,
        title: title || undefined,
        company: company || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro ao analisar vaga");
      setLoading(false);
      return;
    }

    router.push(`/jobs/${data.jobApp.id}`);
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ margin: "0 0 0.5rem" }}>Nova vaga</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Cole o link da vaga ou a descrição. A IA importa, analisa o match com seu perfil e preenche os campos.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="form-group">
          <label>Link da vaga</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => { setJobUrl(e.target.value); setImportedFromUrl(false); }}
              placeholder="https://..."
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleImportUrl}
              disabled={importing || !jobUrl.trim()}
            >
              {importing ? "Importando..." : "Importar da URL"}
            </button>
          </div>
          <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "#64748b" }}>
            A IA extrai título, empresa e descrição da página. Alguns sites podem bloquear — nesse caso, cole o texto manualmente.
          </p>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Título da vaga</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Desenvolvedor Full Stack" />
          </div>
          <div className="form-group">
            <label>Empresa</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex: Empresa XYZ" />
          </div>
        </div>

        <div className="form-group">
          <label>Descrição da vaga</label>
          <textarea
            rows={12}
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Cole aqui a descrição completa da vaga ou importe pelo link acima..."
            required
            minLength={50}
          />
        </div>

        {importedFromUrl && (
          <p className="form-success" style={{ marginBottom: "1rem" }}>
            Vaga importada da URL. Revise os campos e clique em analisar.
          </p>
        )}

        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading || jobText.length < 50}>
          {loading ? "Analisando match com IA..." : "Analisar vaga e calcular match"}
        </button>
      </form>
    </div>
  );
}
