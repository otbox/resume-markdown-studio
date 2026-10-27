import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { z } from "zod";
import { fetchJobTextFromUrl } from "@/lib/jobs/fetch-job-url";
import { extractJobFromPageText } from "@/lib/gemini/extract-job-url";

const fetchSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {
  try {
    await requireUser();
    const { url } = fetchSchema.parse(await request.json());

    const pageText = await fetchJobTextFromUrl(url);
    const extracted = await extractJobFromPageText(pageText);

    return NextResponse.json({
      url,
      title: extracted.title,
      company: extracted.company ?? "",
      jobText: extracted.jobText,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao importar vaga da URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
