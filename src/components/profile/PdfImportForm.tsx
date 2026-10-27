"use client";

import { useState } from "react";
import type { ExtractedProfile } from "@/types/profile";

interface PdfImportProps {
  onImported: () => void;
}

export function PdfImportForm({ onImported }: PdfImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleExtract() {
    if (!file) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/profile/import-pdf", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erro ao processar PDF");
      setLoading(false);
      return;
    }

    setExtracted(data.extracted);
    setLoading(false);
  }

  async function handleConfirm() {
    if (!extracted) return;
    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("confirm", "true");
    formData.append("extracted", JSON.stringify(extracted));

    const res = await fetch("/api/profile/import-pdf", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erro ao salvar perfil");
      setSaving(false);
      return;
    }

    setExtracted(null);
    setFile(null);
    setSaving(false);
    onImported();
  }

  if (extracted) {
    return (
      <div className="card">
        <h3 style={{ margin: "0 0 1rem" }}>Revisar dados extraídos</h3>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Verifique os dados antes de salvar. Você poderá editar depois.
        </p>
        <div style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
          <p><strong>Nome:</strong> {extracted.fullName}</p>
          {extracted.headline && <p><strong>Cargo:</strong> {extracted.headline}</p>}
          {extracted.email && <p><strong>E-mail:</strong> {extracted.email}</p>}
          <p><strong>Experiências:</strong> {extracted.experiences.length}</p>
          <p><strong>Formações:</strong> {extracted.educations.length}</p>
          <p><strong>Skills:</strong> {extracted.skills.length}</p>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={saving}>
            {saving ? "Salvando..." : "Confirmar e salvar"}
          </button>
          <button className="btn btn-secondary" onClick={() => setExtracted(null)}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ margin: "0 0 0.75rem" }}>Importar currículo (PDF)</h3>
      <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1rem" }}>
        Envie seu currículo em PDF. A IA extrairá seus dados para revisão.
      </p>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        style={{ marginBottom: "1rem" }}
      />
      {error && <p className="form-error">{error}</p>}
      <button
        className="btn btn-primary"
        onClick={handleExtract}
        disabled={!file || loading}
      >
        {loading ? "Extraindo com IA..." : "Extrair dados"}
      </button>
    </div>
  );
}
