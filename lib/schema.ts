import { z } from "zod";

export const personSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
});

export const billItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1).max(120),
  amount: z.number().positive(),
  paidBy: z.string().min(1),
  splitAmong: z.array(z.string().min(1)).min(1),
});

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
    }),
  ),
});
