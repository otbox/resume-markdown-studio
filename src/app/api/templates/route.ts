import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultTheme } from "@/config/defaultTheme";
import { defaultLayout } from "@/config/defaultLayout";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1),
  themeJson: z.record(z.unknown()).optional(),
  layoutJson: z.record(z.unknown()).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);

  if (searchParams.get("default") === "true") {
    const template = await prisma.resumeTemplate.findFirst({
      where: { userId: user.id, isDefault: true },
      orderBy: { updatedAt: "desc" },
    });

    if (template) {
      return NextResponse.json(template);
    }

    return NextResponse.json({
      id: null,
      name: "Padrão",
      themeJson: defaultTheme,
      layoutJson: defaultLayout,
      isDefault: true,
    });
  }

  const templates = await prisma.resumeTemplate.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = templateSchema.parse(await request.json());

  if (body.isDefault) {
    await prisma.resumeTemplate.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  const template = await prisma.resumeTemplate.create({
    data: {
      userId: user.id,
      name: body.name,
      themeJson: (body.themeJson ?? defaultTheme) as Prisma.InputJsonValue,
      layoutJson: (body.layoutJson ?? defaultLayout) as Prisma.InputJsonValue,
      isDefault: body.isDefault ?? false,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
