import type { Experience, Education, Project, Skill, Profile } from "@prisma/client";

type ProfileWithRelations = Profile & {
  experiences: Experience[];
  educations: Education[];
  projects: Project[];
  skills: Skill[];
};

function formatContacts(profile: ProfileWithRelations): string[] {
  const contacts: string[] = [];
  if (profile.email) contacts.push(profile.email);
  if (profile.phone) contacts.push(profile.phone);
  if (profile.location) contacts.push(profile.location);
  if (profile.linkedin) contacts.push(profile.linkedin);
  if (profile.github) contacts.push(profile.github);
  return contacts;
}

function formatExperience(exp: Experience): string {
  const period = [exp.startDate, exp.isCurrent ? "Atual" : exp.endDate]
    .filter(Boolean)
    .join(" — ");
  const header = `**${exp.role}** — ${exp.company}${period ? ` (${period})` : ""}`;
  const bullets = exp.bullets.map((b) => `- ${b}`).join("\n");
  const techs =
    exp.technologies.length > 0
      ? `\n*Tech:* ${exp.technologies.join(", ")}`
      : "";
  return `${header}\n${bullets}${techs}`;
}

function formatEducation(edu: Education): string {
  const period = [edu.startDate, edu.endDate].filter(Boolean).join(" — ");
  const header = `**${edu.degree}** — ${edu.institution}${period ? ` (${period})` : ""}`;
  return edu.description ? `${header}\n${edu.description}` : header;
}

function formatProject(proj: Project): string {
  const link = proj.url ? ` ([link](${proj.url}))` : "";
  const techs =
    proj.technologies.length > 0
      ? `\n*Tech:* ${proj.technologies.join(", ")}`
      : "";
  return `**${proj.name}**${link}\n${proj.description ?? ""}${techs}`;
}

export function profileToMarkdown(profile: ProfileWithRelations): string {
  const contacts = formatContacts(profile);
  const hardSkills = profile.skills.filter((s) => s.category === "HARD");
  const softSkills = profile.skills.filter((s) => s.category === "SOFT");

  const lines: string[] = [
    `# ${profile.fullName}${profile.headline ? ` | ${profile.headline}` : ""}`,
    ...contacts.map((c) => `> ${c}`),
    "",
    `## resumo | Resumo`,
    profile.summary ?? "",
    "",
    `## experiencia | Experiência`,
    ...profile.experiences.map(formatExperience),
    "",
    `## formacao | Formação`,
    ...profile.educations.map(formatEducation),
    "",
    `## projetos | Projetos`,
    ...profile.projects.map(formatProject),
    "",
    `## hard-skills | Hard Skills`,
    hardSkills.map((s) => `- ${s.name}${s.level ? ` (${s.level})` : ""}`).join("\n"),
    "",
    `## soft-skills | Soft Skills`,
    softSkills.map((s) => `- ${s.name}`).join("\n"),
    "",
    `## contato | Contato`,
    contacts.map((c) => `- ${c}`).join("\n"),
  ];

  return lines.join("\n").trim();
}
