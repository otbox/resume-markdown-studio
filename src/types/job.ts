import { z } from "zod";

const optionalString = z.string().nullish().transform((v) => v ?? undefined);

export const jobUrlExtractSchema = z.object({
  title: z.string().min(1),
  company: optionalString,
  jobText: z.string().min(50),
});

export type JobUrlExtract = z.infer<typeof jobUrlExtractSchema>;
