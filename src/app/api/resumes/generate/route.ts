import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTailoredResume } from "@/lib/gemini/generate-resume";
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
    const markdown = await generateTailoredResume(
      profileMarkdown,
      analysis,
      jobApp.rawJobText
    );

    const lastVersion = await prisma.generatedResume.findFirst({
      where: { jobApplicationId: jobApp.id },
      orderBy: { version: "desc" },
    });

    const resume = await prisma.generatedResume.create({
      data: {
        profileId: profile.id,
        jobApplicationId: jobApp.id,
        markdownContent: markdown,
        version: (lastVersion?.version ?? 0) + 1,
      },
    });

    return NextResponse.json({ resume });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { profile } = await requireProfile();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const resume = await prisma.generatedResume.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!resume) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(resume);
  }

  const resumes = await prisma.generatedResume.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(resumes);
}

export async function PUT(request: Request) {
  const { profile } = await requireProfile();
  const body = await request.json();
  const { id, markdownContent } = body;

  const resume = await prisma.generatedResume.updateMany({
    where: { id, profileId: profile.id },
    data: { markdownContent },
  });

  return NextResponse.json(resume);
}
