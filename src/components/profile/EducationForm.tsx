"use client";

import { useEffect, useState } from "react";

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

interface EducationFormProps {
  education?: EducationItem | null;
  onSaved: () => void;
  onCancel?: () => void;
}

const emptyForm = {
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  description: "",
};

export function EducationForm({ education, onSaved, onCancel }: EducationFormProps) {
  const isEditing = !!education;
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (education) {
      setForm({
        institution: education.institution,
        degree: education.degree,
        field: education.field ?? "",
        startDate: education.startDate ?? "",
        endDate: education.endDate ?? "",
        description: education.description ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [education]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      type: "education",
      data: {
        institution: form.institution,
        degree: form.degree,
        field: form.field || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        description: form.description || undefined,
      },
    };

    const res = await fetch("/api/experiences", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEditing ? { ...payload, id: education!.id } : payload),
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
        {isEditing ? "Editar formação" : "Adicionar formação"}
      </h4>
      <div className="grid-2">
        <div className="form-group">
          <label>Instituição</label>
          <input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Grau / Curso</label>
          <input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Área (opcional)</label>
          <input value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} placeholder="Ciência da Computação" />
        </div>
        <div className="form-group">
          <label>Início</label>
          <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} placeholder="2018" />
        </div>
        <div className="form-group">
          <label>Fim</label>
          <input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} placeholder="2022" />
        </div>
      </div>
      <div className="form-group">
        <label>Descrição (opcional)</label>
        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
