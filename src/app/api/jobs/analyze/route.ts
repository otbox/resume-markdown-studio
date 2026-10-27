import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeJob } from "@/lib/gemini/analyze-job";
import { profileToMarkdown } from "@/utils/profileToMarkdown";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const analyzeSchema = z.object({
  jobText: z.string().min(50),
  jobUrl: z.string().url().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { profile } = await requireProfile();
    const body = analyzeSchema.parse(await request.json());

    const profileMarkdown = profileToMarkdown(profile);
    const analysis = await analyzeJob(body.jobText, profileMarkdown);

    const jobApp = await prisma.jobApplication.create({
      data: {
        profileId: profile.id,
        title: body.title || analysis.title,
        company: body.company || analysis.company,
        jobUrl: body.jobUrl,
        rawJobText: body.jobText,
        analysisJson: analysis as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ jobApp, analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const { profile } = await requireProfile();
  const jobs = await prisma.jobApplication.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    include: { generatedResumes: { orderBy: { version: "desc" }, take: 1 } },
  });
  return NextResponse.json(jobs);
}
