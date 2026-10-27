import { generateWithFallback, extractJsonFromResponse } from "./client";
import { jobAnalysisSchema, type JobAnalysis } from "@/types/profile";

const ANALYZE_PROMPT = `You are a job posting analyst. Analyze the job description and return ONLY valid JSON:
{
  "title": "job title",
  "company": "company name or null",
  "requiredSkills": ["skill"],
  "preferredSkills": ["skill"],
  "keywords": ["keyword"],
  "responsibilities": ["responsibility"],
  "cultureSignals": ["signal"],
  "matchScore": 0-100,
  "gaps": ["gap in candidate profile vs job"],
  "recommendations": ["how to tailor resume"]
}
If candidate profile is provided, calculate matchScore and gaps based on it.
Do NOT invent requirements not present in the job text.`;

export async function analyzeJob(
  jobText: string,
  candidateProfile?: string
): Promise<JobAnalysis> {
  const prompt = candidateProfile
    ? `${ANALYZE_PROMPT}\n\nJob posting:\n${jobText}\n\nCandidate profile:\n${candidateProfile}`
    : `${ANALYZE_PROMPT}\n\nJob posting:\n${jobText}`;

  const text = await generateWithFallback((model) =>
    model.generateContent(prompt)
  );
  const parsed = extractJsonFromResponse(text);
  return jobAnalysisSchema.parse(parsed);
}
