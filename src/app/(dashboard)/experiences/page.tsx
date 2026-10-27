"use client";

import { useEffect, useState, useCallback } from "react";
import { ExperienceForm, type ExperienceItem } from "@/components/profile/ExperienceForm";
import { EducationForm, type EducationItem } from "@/components/profile/EducationForm";
import { ProjectForm, type ProjectItem } from "@/components/profile/ProjectForm";

interface Skill {
  id: string;
  name: string;
  category: "HARD" | "SOFT";
  level?: string | null;
}

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [editingExperience, setEditingExperience] = useState<ExperienceItem | null>(null);
  const [editingEducation, setEditingEducation] = useState<EducationItem | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [expRes, profRes] = await Promise.all([
      fetch("/api/experiences"),
      fetch("/api/profile"),
    ]);
    const expData = await expRes.json();
    const profData = await profRes.json();
    setExperiences(expData.experiences ?? []);
    if (profRes.ok && profData) {
      setEducations(profData.educations ?? []);
      setProjects(profData.projects ?? []);
      setSkills(profData.skills ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string, type: string) {
    await fetch(`/api/experiences?id=${id}&type=${type}`, { method: "DELETE" });
    if (type === "experience" && editingExperience?.id === id) setEditingExperience(null);
    if (type === "education" && editingEducation?.id === id) setEditingEducation(null);
    if (type === "project" && editingProject?.id === id) setEditingProject(null);
    load();
  }

  async function addSkill(data: Record<string, string>) {
    await fetch("/api/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "skill", data: { ...data, category: "HARD" } }),
    });
    load();
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1 style={{ margin: "0 0 1.5rem" }}>Experiências e qualificações</h1>

      <div style={{ display: "grid", gap: "2rem", maxWidth: 900 }}>
        {/* Experiências */}
        <section>
          {!editingExperience && <ExperienceForm onSaved={load} />}
          {editingExperience && (
            <ExperienceForm
              experience={editingExperience}
              onSaved={() => { setEditingExperience(null); load(); }}
              onCancel={() => setEditingExperience(null)}
            />
          )}
          {experiences.map((exp) => (
            <div key={exp.id} className="card" style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem" }}>{exp.role}</h3>
                  <p style={{ margin: 0, color: "#64748b" }}>
                    {exp.company}
                    {[exp.startDate, exp.isCurrent ? "Atual" : exp.endDate].filter(Boolean).length > 0 && (
                      <> · {[exp.startDate, exp.isCurrent ? "Atual" : exp.endDate].filter(Boolean).join(" — ")}</>
                    )}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-secondary" style={{ fontSize: "0.8125rem" }} onClick={() => setEditingExperience(exp)} disabled={!!editingExperience}>Editar</button>
                  <button className="btn btn-secondary" style={{ fontSize: "0.8125rem" }} onClick={() => handleDelete(exp.id, "experience")}>Remover</button>
                </div>
              </div>
              {exp.bullets.length > 0 && (
                <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
                  {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>

        {/* Formação */}
        <section className="card">
          <h3 style={{ margin: "0 0 0.75rem" }}>Formação</h3>
          {educations.length === 0 && !editingEducation && (
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", margin: 0 }}>Nenhuma formação cadastrada.</p>
          )}
          {educations.map((edu) => (
            <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", fontSize: "0.875rem", paddingBottom: "0.75rem", borderBottom: editingEducation?.id === edu.id ? "none" : "1px solid #f1f5f9" }}>
              <div>
                <strong>{edu.degree}</strong> — {edu.institution}
                {(edu.startDate || edu.endDate) && (
                  <span style={{ color: "#64748b" }}> ({[edu.startDate, edu.endDate].filter(Boolean).join(" — ")})</span>
                )}
                {edu.field && <p style={{ margin: "0.25rem 0 0", color: "#94a3b8", fontSize: "0.8125rem" }}>{edu.field}</p>}
                {edu.description && <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.8125rem" }}>{edu.description}</p>}
              </div>
              <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }} onClick={() => setEditingEducation(edu)} disabled={!!editingEducation}>Editar</button>
                <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }} onClick={() => handleDelete(edu.id, "education")}>Remover</button>
              </div>
            </div>
          ))}
          {editingEducation ? (
            <EducationForm
              education={editingEducation}
              onSaved={() => { setEditingEducation(null); load(); }}
              onCancel={() => setEditingEducation(null)}
            />
          ) : (
            <EducationForm onSaved={load} />
          )}
        </section>

        {/* Projetos */}
        <section className="card">
          <h3 style={{ margin: "0 0 0.75rem" }}>Projetos</h3>
          {projects.length === 0 && !editingProject && (
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", margin: 0 }}>Nenhum projeto cadastrado.</p>
          )}
          {projects.map((proj) => (
            <div key={proj.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", fontSize: "0.875rem", paddingBottom: "0.75rem", borderBottom: editingProject?.id === proj.id ? "none" : "1px solid #f1f5f9" }}>
              <div>
                <strong>{proj.name}</strong>
                {proj.url && (
                  <a href={proj.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: "#0d9488", fontSize: "0.8125rem" }}>link</a>
                )}
                {proj.description && <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.8125rem" }}>{proj.description}</p>}
                {proj.technologies.length > 0 && (
                  <p style={{ margin: "0.25rem 0 0", color: "#94a3b8", fontSize: "0.8125rem" }}>{proj.technologies.join(", ")}</p>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }} onClick={() => setEditingProject(proj)} disabled={!!editingProject}>Editar</button>
                <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }} onClick={() => handleDelete(proj.id, "project")}>Remover</button>
              </div>
            </div>
          ))}
          {editingProject ? (
            <ProjectForm
              project={editingProject}
              onSaved={() => { setEditingProject(null); load(); }}
              onCancel={() => setEditingProject(null)}
            />
          ) : (
            <ProjectForm onSaved={load} />
          )}
        </section>

        {/* Skills */}
        <section className="card">
          <h3>Skills</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {skills.map((skill) => (
              <span key={skill.id} className="badge badge-teal" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                {skill.name}
                <button onClick={() => handleDelete(skill.id, "skill")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "0.875rem" }}>×</button>
              </span>
            ))}
          </div>
          <QuickAddForm
            fields={[{ name: "name", label: "Skill", required: true }]}
            onSubmit={addSkill}
          />
        </section>
      </div>
    </div>
  );
}

function QuickAddForm({
  fields,
  onSubmit,
}: {
  fields: { name: string; label: string; required?: boolean }[];
  onSubmit: (data: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
        setValues({});
      }}
      style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}
    >
      {fields.map((f) => (
        <input
          key={f.name}
          placeholder={f.label}
          value={values[f.name] ?? ""}
          onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
          required={f.required}
          style={{ flex: 1, minWidth: 120, padding: "0.375rem 0.5rem", border: "1px solid #cbd5e1", borderRadius: 6 }}
        />
      ))}
      <button type="submit" className="btn btn-primary" style={{ padding: "0.375rem 0.75rem" }}>+</button>
    </form>
  );
}
