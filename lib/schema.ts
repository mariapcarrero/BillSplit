import { z } from "zod";

export const personSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
});

export const billItemSchema = z
  .object({
    id: z.string().min(1),
    description: z.string().min(1).max(120),
    amount: z.number().positive(),
    paidBy: z.string().min(1),
    splitAmong: z.array(z.string().min(1)).min(1),
    splitMode: z.enum(["equal", "percentage"]).optional(),
    splitPercentages: z.record(z.string(), z.number().min(0).max(100)).optional(),
  })
  .refine(
    (item) => {
      if (item.splitMode !== "percentage") return true;
      const percentages = item.splitPercentages;
      if (!percentages) return false;
      if (Object.keys(percentages).length !== item.splitAmong.length) return false;
      if (!item.splitAmong.every((id) => id in percentages)) return false;
      const total = Object.values(percentages).reduce((sum, p) => sum + p, 0);
      return Math.abs(total - 100) < 0.05;
    },
    { message: "Percentages must be provided for each split participant and sum to 100." },
  );

export const billSchema = z.object({
  title: z.string().min(1).max(80),
  people: z.array(personSchema).min(2),
  items: z.array(billItemSchema),
});

export const aiParseRequestSchema = z.object({
  text: z.string().min(1).max(500),
  people: z.array(personSchema).min(1),
});

export const aiParseResponseSchema = z.object({
  items: z.array(
    z.object({
      description: z.string(),
      amount: z.number().positive(),
      paidBy: z.string(),
      splitAmong: z.array(z.string()).min(1),
      splitMode: z.enum(["equal", "percentage"]).nullable(),
      // Relative shares per person id — not required to sum to 100; the server
      // rescales them (see normalizePercentages) since the model's numbers are
      // only ever approximate. OpenAI structured outputs requires every field
      // present, so this is an array of pairs rather than an arbitrary-key record.
      splitPercentages: z
        .array(z.object({ personId: z.string(), share: z.number().min(0) }))
        .nullable(),
    }),
  ),
});
