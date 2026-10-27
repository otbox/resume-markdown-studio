import { generateWithFallback, extractJsonFromResponse } from "./client";
import {
  extractedProfileSchema,
  type ExtractedProfile,
} from "@/types/profile";

const EXTRACT_PROMPT = `You are a resume parser. Extract structured data from this PDF resume.
Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "fullName": "string",
  "headline": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "linkedin": "string or null",
  "github": "string or null",
  "summary": "string or null",
  "experiences": [{
    "company": "string",
    "role": "string",
    "location": "string or null",
    "startDate": "string or null",
    "endDate": "string or null",
    "isCurrent": false,
    "bullets": ["string"],
    "technologies": ["string"]
  }],
  "educations": [{
    "institution": "string",
    "degree": "string",
    "field": "string or null",
    "startDate": "string or null",
    "endDate": "string or null",
    "description": "string or null"
  }],
  "projects": [{
    "name": "string",
    "url": "string or null",
    "description": "string or null",
    "technologies": ["string"]
  }],
  "skills": [{
    "name": "string",
    "category": "HARD or SOFT",
    "level": "string or null"
  }]
}
Do NOT invent information. Only extract what is clearly present in the document.`;

export async function extractProfileFromPdf(
  pdfBase64: string,
  mimeType = "application/pdf"
): Promise<ExtractedProfile> {
  const text = await generateWithFallback((model) =>
    model.generateContent([
      { text: EXTRACT_PROMPT },
      { inlineData: { mimeType, data: pdfBase64 } },
    ])
  );
  const parsed = extractJsonFromResponse(text);
  return extractedProfileSchema.parse(parsed);
}

export async function extractProfileFromText(
  resumeText: string
): Promise<ExtractedProfile> {
  const text = await generateWithFallback((model) =>
    model.generateContent(`${EXTRACT_PROMPT}\n\nResume text:\n${resumeText}`)
  );
  const parsed = extractJsonFromResponse(text);
  return extractedProfileSchema.parse(parsed);
}
