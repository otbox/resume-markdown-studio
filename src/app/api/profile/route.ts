import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/types/profile";

export async function GET() {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: {
      experiences: { orderBy: { sortOrder: "asc" } },
      educations: { orderBy: { sortOrder: "asc" } },
      projects: { orderBy: { sortOrder: "asc" } },
      skills: { orderBy: { sortOrder: "asc" } },
    },
  });
  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const data = profileUpdateSchema.parse(body);

  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
  }

  const profile = await prisma.profile.create({
    data: { ...data, userId: user.id },
  });

  return NextResponse.json(profile, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const data = profileUpdateSchema.parse(body);

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: data,
    create: { ...data, userId: user.id },
  });

  return NextResponse.json(profile);
}
