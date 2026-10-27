import { generateWithFallback } from "./client";
import type { JobAnalysis } from "@/types/profile";

const GENERATE_PROMPT = `You are a professional resume writer specialized in ATS-friendly, AI-parseable resumes.

CRITICAL RULES:
- Do NOT invent experiences, education, projects, or skills not present in the candidate profile
- Only rephrase, reorder, and emphasize existing content to match the job requirements
- Use keywords from the job analysis naturally
- Keep factual accuracy — dates, companies, and roles must match the source profile
- TARGET ONE PAGE ONLY: max 3-4 bullets per experience, summary max 3 sentences, omit less relevant items
- ATS/AI optimization: use standard section headings, plain markdown, no tables, no columns syntax, clear bullet points
- Prioritize recent and relevant experience for the job; shorten or omit older/irrelevant entries to fit one page

Markdown format:
# Full Name | Headline
> email
> phone
> location
> linkedin
> github

## resumo | Resumo
(tailored professional summary, max 3 sentences, keyword-rich)

## experiencia | Experiência
**Role** — Company (Start — End)
- achievement bullet (max 3-4 per role)
*Tech:* tech1, tech2

## formacao | Formação
**Degree** — Institution (Start — End)

## projetos | Projetos
(only most relevant projects, 1-2 max)
**Project Name** ([link](url))
description
*Tech:* tech1, tech2

## hard-skills | Hard Skills
- skill (prioritize job keywords)

## soft-skills | Soft Skills
- skill (max 5)

## contato | Contato
- contact info

Return ONLY the markdown content, no code fences or explanations. Keep total length suitable for ONE A4 page.`;

export async function generateTailoredResume(
  profileMarkdown: string,
  jobAnalysis: JobAnalysis,
  jobText: string
): Promise<string> {
  let markdown = (
    await generateWithFallback((model) =>
      model.generateContent(
        `${GENERATE_PROMPT}

Candidate profile (source of truth):
${profileMarkdown}

Job posting:
${jobText}

Job analysis:
${JSON.stringify(jobAnalysis, null, 2)}`
      )
    )
  ).trim();
  if (markdown.startsWith("```")) {
    markdown = markdown.replace(/^```(?:markdown)?\n?/, "").replace(/\n?```$/, "");
  }
  return markdown.trim();
}
