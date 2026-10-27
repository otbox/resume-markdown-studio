import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractProfileFromPdf } from "@/lib/gemini/extract-profile";
import { extractedProfileSchema } from "@/types/profile";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const confirm = formData.get("confirm") === "true";
    const extractedJson = formData.get("extracted") as string | null;

    if (extractedJson && confirm) {
      const extracted = extractedProfileSchema.parse(JSON.parse(extractedJson));

      const profile = await prisma.profile.upsert({
        where: { userId: user.id },
        update: {
          fullName: extracted.fullName,
          headline: extracted.headline,
          email: extracted.email,
          phone: extracted.phone,
          location: extracted.location,
          linkedin: extracted.linkedin,
          github: extracted.github,
          summary: extracted.summary,
        },
        create: {
          userId: user.id,
          fullName: extracted.fullName,
          headline: extracted.headline,
          email: extracted.email,
          phone: extracted.phone,
          location: extracted.location,
          linkedin: extracted.linkedin,
          github: extracted.github,
          summary: extracted.summary,
        },
      });

      await prisma.experience.deleteMany({ where: { profileId: profile.id } });
      await prisma.education.deleteMany({ where: { profileId: profile.id } });
      await prisma.project.deleteMany({ where: { profileId: profile.id } });
      await prisma.skill.deleteMany({ where: { profileId: profile.id } });

      if (extracted.experiences.length) {
        await prisma.experience.createMany({
          data: extracted.experiences.map((exp, i) => ({
            profileId: profile.id,
            company: exp.company,
            role: exp.role,
            location: exp.location,
            startDate: exp.startDate,
            endDate: exp.endDate,
            isCurrent: exp.isCurrent ?? false,
            bullets: exp.bullets,
            technologies: exp.technologies,
            sortOrder: i,
          })),
        });
      }

      if (extracted.educations.length) {
        await prisma.education.createMany({
          data: extracted.educations.map((edu, i) => ({
            profileId: profile.id,
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            startDate: edu.startDate,
            endDate: edu.endDate,
            description: edu.description,
            sortOrder: i,
          })),
        });
      }

      if (extracted.projects.length) {
        await prisma.project.createMany({
          data: extracted.projects.map((proj, i) => ({
            profileId: profile.id,
            name: proj.name,
            url: proj.url,
            description: proj.description,
            technologies: proj.technologies,
            sortOrder: i,
          })),
        });
      }

      if (extracted.skills.length) {
        await prisma.skill.createMany({
          data: extracted.skills.map((skill, i) => ({
            profileId: profile.id,
            name: skill.name,
            category: skill.category,
            level: skill.level,
            sortOrder: i,
          })),
        });
      }

      return NextResponse.json({ profile, saved: true });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const storagePath = `resumes/${user.id}/${Date.now()}.pdf`;

    try {
      const admin = createAdminClient();
      await admin.storage.from("resume-pdfs").upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });
    } catch {
      // Storage may not be configured yet — continue with extraction
    }

    const extracted = await extractProfileFromPdf(base64);

    return NextResponse.json({ extracted, storagePath, review: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
