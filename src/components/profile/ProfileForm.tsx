"use client";

import { useState } from "react";

interface ProfileFormProps {
  initial?: {
    fullName: string;
    headline?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedin?: string | null;
    github?: string | null;
    summary?: string | null;
  };
  onSaved: () => void;
}

export function ProfileForm({ initial, onSaved }: ProfileFormProps) {
  const [form, setForm] = useState({
    fullName: initial?.fullName ?? "",
    headline: initial?.headline ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    location: initial?.location ?? "",
    linkedin: initial?.linkedin ?? "",
    github: initial?.github ?? "",
    summary: initial?.summary ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const method = initial ? "PUT" : "POST";
    const res = await fetch("/api/profile", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro ao salvar");
      setLoading(false);
      return;
    }

    setSuccess("Perfil salvo com sucesso!");
    setLoading(false);
    onSaved();
  }

  const fields = [
    { key: "fullName", label: "Nome completo", required: true },
    { key: "headline", label: "Cargo / Headline" },
    { key: "email", label: "E-mail" },
    { key: "phone", label: "Telefone" },
    { key: "location", label: "Localização" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "github", label: "GitHub" },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 style={{ margin: "0 0 1rem" }}>Dados pessoais</h3>
      {fields.map(({ key, label }) => (
        <div className="form-group" key={key}>
          <label htmlFor={key}>{label}</label>
          <input
            id={key}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            required={key === "fullName"}
          />
        </div>
      ))}
      <div className="form-group">
        <label htmlFor="summary">Resumo profissional</label>
        <textarea
          id="summary"
          rows={4}
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Salvando..." : "Salvar perfil"}
      </button>
    </form>
  );
}
