import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTailoredResumeLatex } from "@/lib/gemini/generate-resume-latex";
import { profileToMarkdown } from "@/utils/profileToMarkdown";
import { jobAnalysisSchema } from "@/types/profile";
import { z } from "zod";

const generateSchema = z.object({
  jobApplicationId: z.string(),
});

export async function POST(request: Request) {
  try {
    const { profile } = await requireProfile();
    const { jobApplicationId } = generateSchema.parse(await request.json());

    const jobApp = await prisma.jobApplication.findFirst({
      where: { id: jobApplicationId, profileId: profile.id },
    });

    if (!jobApp) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const analysis = jobAnalysisSchema.parse(jobApp.analysisJson);
    const profileMarkdown = profileToMarkdown(profile);
    const latex = await generateTailoredResumeLatex(
      profileMarkdown,
      analysis,
      jobApp.rawJobText
    );

    const lastVersion = await prisma.generatedResume.findFirst({
      where: { jobApplicationId: jobApp.id },
      orderBy: { version: "desc" },
    });

    // Mantém markdownContent preenchido (campo obrigatório no schema): o LaTeX
    // é a entrega desta rota, o markdown fica vazio como placeholder.
    const resume = await prisma.generatedResume.create({
      data: {
        profileId: profile.id,
        jobApplicationId: jobApp.id,
        markdownContent: "",
        latexContent: latex,
        version: (lastVersion?.version ?? 0) + 1,
      },
    });

    return NextResponse.json({ resume });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { profile } = await requireProfile();
    const { id, latexContent } = z
      .object({ id: z.string(), latexContent: z.string() })
      .parse(await request.json());

    const resume = await prisma.generatedResume.updateMany({
      where: { id, profileId: profile.id },
      data: { latexContent },
    });

    return NextResponse.json({ resume });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
