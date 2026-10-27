"use client";

import { useEffect, useState } from "react";

export interface ProjectItem {
  id: string;
  name: string;
  url?: string | null;
  description?: string | null;
  technologies: string[];
}

interface ProjectFormProps {
  project?: ProjectItem | null;
  onSaved: () => void;
  onCancel?: () => void;
}

const emptyForm = {
  name: "",
  url: "",
  description: "",
  technologies: "",
};

export function ProjectForm({ project, onSaved, onCancel }: ProjectFormProps) {
  const isEditing = !!project;
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        url: project.url ?? "",
        description: project.description ?? "",
        technologies: project.technologies.join(", "),
      });
    } else {
      setForm(emptyForm);
    }
  }, [project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      type: "project",
      data: {
        name: form.name,
        url: form.url || undefined,
        description: form.description || undefined,
        technologies: form.technologies.split(",").map((t) => t.trim()).filter(Boolean),
      },
    };

    const res = await fetch("/api/experiences", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEditing ? { ...payload, id: project!.id } : payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao salvar");
      setLoading(false);
      return;
    }

    if (!isEditing) setForm(emptyForm);
    setLoading(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
      <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem" }}>
        {isEditing ? "Editar projeto" : "Adicionar projeto"}
      </h4>
      <div className="grid-2">
        <div className="form-group">
          <label>Nome</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>URL (opcional)</label>
          <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://github.com/..." />
        </div>
      </div>
      <div className="form-group">
        <label>Descrição</label>
        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Tecnologias (separadas por vírgula)</label>
        <input value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="React, Node.js" />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Salvando..." : isEditing ? "Salvar" : "Adicionar"}
        </button>
        {isEditing && onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        )}
      </div>
    </form>
  );
}
