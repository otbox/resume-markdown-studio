"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { LayoutPanel } from "@/components/panels/LayoutPanel";
import { ThemePanel } from "@/components/panels/ThemePanel";
import { ShapesPanel } from "@/components/panels/ShapesPanel";
import { usePdfExport } from "@/hooks/usePdfExport";
import { useResumePreferences } from "@/hooks/useResumePreferences";

interface Resume {
  id: string;
  markdownContent: string;
}

type SideTab = "editor" | "theme" | "layout" | "shapes";

export default function StudioPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const [resume, setResume] = useState<Resume | null>(null);
  const [markdown, setMarkdown] = useState("");
  const { theme, setTheme, layout, setLayout, loading: prefsLoading } = useResumePreferences();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sideTab, setSideTab] = useState<SideTab>("editor");
  const [pdfError, setPdfError] = useState("");
  const { exportPdf } = usePdfExport();

  const load = useCallback(async () => {
    const res = await fetch(`/api/resumes/generate?id=${resumeId}`);
    const data = await res.json();
    if (res.ok) {
      setResume(data);
      setMarkdown(data.markdownContent);
    }
    setLoading(false);
  }, [resumeId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/resumes/generate", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: resumeId, markdownContent: markdown }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExportPdf() {
    setPdfError("");
    try {
      await exportPdf(markdown, layout, theme, "curriculo-adaptado.pdf");
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Erro ao exportar PDF");
    }
  }

  if (loading || prefsLoading) return <p>Carregando studio...</p>;
  if (!resume) return <p>Currículo não encontrado.</p>;

  const sideTabs: { id: SideTab; label: string }[] = [
    { id: "editor", label: "Editor" },
    { id: "theme", label: "Cores" },
    { id: "layout", label: "Layout" },
    { id: "shapes", label: "Formas" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>Resume Studio</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/preferences" className="btn btn-secondary" style={{ fontSize: "0.875rem" }}>
            Preferências globais
          </Link>
          <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar texto"}
          </button>
          <button className="btn btn-primary" onClick={handleExportPdf}>
            Exportar PDF (texto ATS)
          </button>
        </div>
      </div>

      {pdfError && <p className="form-error" style={{ marginBottom: "1rem" }}>{pdfError}</p>}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {sideTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={sideTab === t.id ? "btn btn-primary" : "btn btn-secondary"}
            style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}
            onClick={() => setSideTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          {sideTab === "editor" && (
            <div className="card">
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Editor Markdown</h3>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 0.75rem" }}>
                Currículo otimizado para ATS/IA — prefira 1 página. Encurte seções se o preview mostrar mais de uma página.
              </p>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                rows={28}
                style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8125rem", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.75rem" }}
              />
            </div>
          )}
          {sideTab === "theme" && <ThemePanel theme={theme} onChange={setTheme} />}
          {sideTab === "layout" && <LayoutPanel layout={layout} onChange={setLayout} />}
          {sideTab === "shapes" && <ShapesPanel theme={theme} onChange={setTheme} />}
        </div>
        <div>
          <ResumePreview markdown={markdown} theme={theme} layout={layout} scale={0.55} highlightShapes={sideTab === "shapes"} />
        </div>
      </div>
    </div>
  );
}
