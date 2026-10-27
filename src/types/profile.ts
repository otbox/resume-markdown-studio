import { z } from "zod";

/** Gemini returns null for missing optional fields — accept null and normalize to undefined */
const optionalString = z.string().nullish().transform((v) => v ?? undefined);

export const extractedExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  location: optionalString,
  startDate: optionalString,
  endDate: optionalString,
  isCurrent: z.boolean().nullish().transform((v) => v ?? undefined),
  bullets: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});

export const extractedEducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: optionalString,
  startDate: optionalString,
  endDate: optionalString,
  description: optionalString,
});

export const extractedProjectSchema = z.object({
  name: z.string(),
  url: optionalString,
  description: optionalString,
  technologies: z.array(z.string()).default([]),
});

export const extractedSkillSchema = z.object({
  name: z.string(),
  category: z.enum(["HARD", "SOFT"]).default("HARD"),
  level: optionalString,
});

export const extractedProfileSchema = z.object({
  fullName: z.string().min(1),
  headline: optionalString,
  email: optionalString,
  phone: optionalString,
  location: optionalString,
  linkedin: optionalString,
  github: optionalString,
  summary: optionalString,
  experiences: z.array(extractedExperienceSchema).default([]),
  educations: z.array(extractedEducationSchema).default([]),
  projects: z.array(extractedProjectSchema).default([]),
  skills: z.array(extractedSkillSchema).default([]),
});

export type ExtractedProfile = z.infer<typeof extractedProfileSchema>;

export const jobAnalysisSchema = z.object({
  title: z.string(),
  company: optionalString,
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  cultureSignals: z.array(z.string()).default([]),
  matchScore: z.number().min(0).max(100),
  gaps: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;

export const profileUpdateSchema = z.object({
  fullName: z.string().min(1),
  headline: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  summary: z.string().optional(),
});

export const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1),
  url: z.string().optional(),
  description: z.string().optional(),
  technologies: z.array(z.string()).default([]),
});

export const skillSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["HARD", "SOFT"]).default("HARD"),
  level: z.string().optional(),
});
