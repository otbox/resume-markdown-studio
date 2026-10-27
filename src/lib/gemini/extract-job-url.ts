import { generateWithFallback, extractJsonFromResponse } from "./client";
import { jobUrlExtractSchema, type JobUrlExtract } from "@/types/job";

const EXTRACT_JOB_PROMPT = `You extract job posting data from raw webpage text.
Return ONLY valid JSON:
{
  "title": "job title",
  "company": "company name or null",
  "jobText": "full cleaned job description including requirements, responsibilities and qualifications"
}
Rules:
- jobText must be at least 50 characters and contain the actual posting content
- Do NOT invent information not present in the text
- Remove navigation, footer, cookie banners and unrelated page content from jobText`;

export async function extractJobFromPageText(pageText: string): Promise<JobUrlExtract> {
  const text = await generateWithFallback((model) =>
    model.generateContent(`${EXTRACT_JOB_PROMPT}\n\nWebpage text:\n${pageText.slice(0, 15000)}`)
  );
  const parsed = extractJsonFromResponse(text);
  return jobUrlExtractSchema.parse(parsed);
}
