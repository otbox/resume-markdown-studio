"use client";

import { useState } from "react";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { ThemePanel } from "@/components/panels/ThemePanel";
import { LayoutPanel } from "@/components/panels/LayoutPanel";
import { ShapesPanel } from "@/components/panels/ShapesPanel";
import { useResumePreferences } from "@/hooks/useResumePreferences";
import { profileToMarkdown } from "@/utils/profileToMarkdown";

const SAMPLE_MARKDOWN = `# João Silva | Desenvolvedor Full Stack
> joao@email.com
> (11) 99999-9999
> São Paulo, SP

## resumo | Resumo
Desenvolvedor com experiência em React, Node.js e PostgreSQL. Foco em produtos escaláveis e código limpo.

## experiencia | Experiência
**Desenvolvedor Pleno** — Empresa XYZ (2022 — Atual)
- Desenvolvimento de features em React e Next.js
- Integração com APIs REST e GraphQL
*Tech:* React, TypeScript, Node.js

## hard-skills | Hard Skills
- JavaScript / TypeScript
- React / Next.js
- PostgreSQL

## contato | Contato
- joao@email.com
`;

type Tab = "theme" | "layout" | "shapes";

export default function PreferencesPage() {
  const { theme, setTheme, layout, setLayout, loading, saveAsDefault } = useResumePreferences();
  const [tab, setTab] = useState<Tab>("theme");
  const [previewMarkdown, setPreviewMarkdown] = useState(SAMPLE_MARKDOWN);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  async function loadProfilePreview() {
    setLoadingProfile(true);
    const res = await fetch("/api/profile");
    const data = await res.json();
    if (res.ok && data?.fullName) {
      setPreviewMarkdown(profileToMarkdown(data));
    }
    setLoadingProfile(false);
  }

  async function handleSave() {
    setSaving(true);
    const ok = await saveAsDefault();
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (loading) return <p>Carregando preferências...</p>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "theme", label: "Cores e tipografia" },
    { id: "layout", label: "Layout e seções" },
    { id: "shapes", label: "Formas decorativas" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.5rem" }}>Preferências do currículo</h1>
          <p style={{ color: "#64748b", margin: 0, maxWidth: 560 }}>
            Configure cores, barra lateral, formas, layout e seções. Salvo como estilo padrão para todos os currículos gerados.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button type="button" className="btn btn-secondary" onClick={loadProfilePreview} disabled={loadingProfile}>
            {loadingProfile ? "Carregando..." : "Preview com meu perfil"}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar como padrão"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "btn btn-primary" : "btn btn-secondary"}
            style={{ fontSize: "0.875rem" }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: "1.5rem", alignItems: "start" }}>
        <div>
          {tab === "theme" && <ThemePanel theme={theme} onChange={setTheme} />}
          {tab === "layout" && <LayoutPanel layout={layout} onChange={setLayout} />}
          {tab === "shapes" && <ShapesPanel theme={theme} onChange={setTheme} />}
        </div>
        <div>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "#64748b" }}>Preview ao vivo</p>
          <ResumePreview
            markdown={previewMarkdown}
            theme={theme}
            layout={layout}
            scale={0.55}
            highlightShapes={tab === "shapes"}
          />
        </div>
      </div>
    </div>
  );
}
