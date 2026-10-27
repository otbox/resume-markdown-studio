"use client";

import { useEffect, useState } from "react";

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent: boolean;
  bullets: string[];
  technologies: string[];
}

interface ExperienceFormProps {
  experience?: ExperienceItem | null;
  onSaved: () => void;
  onCancel?: () => void;
}

const emptyForm = {
  company: "",
  role: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  bullets: "",
  technologies: "",
};

export function ExperienceForm({ experience, onSaved, onCancel }: ExperienceFormProps) {
  const isEditing = !!experience;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (experience) {
      setForm({
        company: experience.company,
        role: experience.role,
        location: experience.location ?? "",
        startDate: experience.startDate ?? "",
        endDate: experience.endDate ?? "",
        isCurrent: experience.isCurrent,
        bullets: experience.bullets.join("\n"),
        technologies: experience.technologies.join(", "),
      });
    } else {
      setForm(emptyForm);
    }
  }, [experience]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      type: "experience",
      data: {
        company: form.company,
        role: form.role,
        location: form.location || undefined,
        startDate: form.startDate || undefined,
        endDate: form.isCurrent ? undefined : form.endDate || undefined,
        isCurrent: form.isCurrent,
        bullets: form.bullets.split("\n").filter(Boolean),
        technologies: form.technologies.split(",").map((t) => t.trim()).filter(Boolean),
      },
    };

    const res = await fetch("/api/experiences", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEditing ? { ...payload, id: experience!.id } : payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao salvar");
      setLoading(false);
      return;
    }

    if (!isEditing) {
      setForm(emptyForm);
    }
    setLoading(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 style={{ margin: "0 0 1rem" }}>
        {isEditing ? "Editar experiência" : "Adicionar experiência"}
      </h3>
      <div className="grid-2">
        <div className="form-group">
          <label>Empresa</label>
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Cargo</label>
          <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Local</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Remoto, São Paulo..." />
        </div>
        <div className="form-group">
          <label>Início</label>
          <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} placeholder="Jan 2020" />
        </div>
        <div className="form-group">
          <label>Fim</label>
          <input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} placeholder="Dez 2023" disabled={form.isCurrent} />
        </div>
      </div>
      <div className="form-group">
        <label>
          <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked, endDate: e.target.checked ? "" : form.endDate })} />
          {" "}Trabalho atual
        </label>
      </div>
      <div className="form-group">
        <label>Conquistas (uma por linha)</label>
        <textarea rows={4} value={form.bullets} onChange={(e) => setForm({ ...form, bullets: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Tecnologias (separadas por vírgula)</label>
        <input value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar"}
        </button>
        {isEditing && onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
