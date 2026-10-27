import { NextResponse } from "next/server";
import { requireUser, getProfileForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { experienceSchema, educationSchema, projectSchema, skillSchema } from "@/types/profile";

export async function GET() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  if (!profile) return NextResponse.json({ experiences: [] });
  return NextResponse.json({ experiences: profile.experiences });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const type = body.type as string;

  if (type === "experience") {
    const data = experienceSchema.parse(body.data);
    const exp = await prisma.experience.create({
      data: { ...data, profileId: profile.id, sortOrder: profile.experiences.length },
    });
    return NextResponse.json(exp, { status: 201 });
  }

  if (type === "education") {
    const data = educationSchema.parse(body.data);
    const edu = await prisma.education.create({
      data: { ...data, profileId: profile.id, sortOrder: profile.educations.length },
    });
    return NextResponse.json(edu, { status: 201 });
  }

  if (type === "project") {
    const data = projectSchema.parse(body.data);
    const proj = await prisma.project.create({
      data: { ...data, profileId: profile.id, sortOrder: profile.projects.length },
    });
    return NextResponse.json(proj, { status: 201 });
  }

  if (type === "skill") {
    const data = skillSchema.parse(body.data);
    const skill = await prisma.skill.create({
      data: { ...data, profileId: profile.id, sortOrder: profile.skills.length },
    });
    return NextResponse.json(skill, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function PUT(request: Request) {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const { id, type, data } = body as { id: string; type: string; data: unknown };

  if (!id || !type) {
    return NextResponse.json({ error: "Missing id or type" }, { status: 400 });
  }

  if (type === "experience") {
    const parsed = experienceSchema.parse(data);
    const updated = await prisma.experience.updateMany({
      where: { id, profileId: profile.id },
      data: parsed,
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }
    const exp = await prisma.experience.findFirst({ where: { id, profileId: profile.id } });
    return NextResponse.json(exp);
  }

  if (type === "education") {
    const parsed = educationSchema.parse(data);
    const updated = await prisma.education.updateMany({
      where: { id, profileId: profile.id },
      data: parsed,
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Education not found" }, { status: 404 });
    }
    const edu = await prisma.education.findFirst({ where: { id, profileId: profile.id } });
    return NextResponse.json(edu);
  }

  if (type === "project") {
    const parsed = projectSchema.parse(data);
    const updated = await prisma.project.updateMany({
      where: { id, profileId: profile.id },
      data: parsed,
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const proj = await prisma.project.findFirst({ where: { id, profileId: profile.id } });
    return NextResponse.json(proj);
  }

  if (type === "skill") {
    const parsed = skillSchema.parse(data);
    const updated = await prisma.skill.updateMany({
      where: { id, profileId: profile.id },
      data: parsed,
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }
    const skill = await prisma.skill.findFirst({ where: { id, profileId: profile.id } });
    return NextResponse.json(skill);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id || !type) {
    return NextResponse.json({ error: "Missing id or type" }, { status: 400 });
  }

  switch (type) {
    case "experience":
      await prisma.experience.deleteMany({ where: { id, profileId: profile.id } });
      break;
    case "education":
      await prisma.education.deleteMany({ where: { id, profileId: profile.id } });
      break;
    case "project":
      await prisma.project.deleteMany({ where: { id, profileId: profile.id } });
      break;
    case "skill":
      await prisma.skill.deleteMany({ where: { id, profileId: profile.id } });
      break;
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  return NextResponse.json({ deleted: true });
}
