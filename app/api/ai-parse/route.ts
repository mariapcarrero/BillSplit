import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { aiParseRequestSchema, aiParseResponseSchema } from "@/lib/schema";

const MODEL = "gpt-4o-mini";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = aiParseRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI parsing is not configured." }, { status: 503 });
  }

  const { text, people } = parsed.data;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const names = people.map((p) => `${p.id}: ${p.name}`).join(", ");

  try {
    const completion = await client.chat.completions.parse({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You convert a natural-language bill description into structured line items. " +
            "Use only the given person ids for paidBy and splitAmong. " +
            "If the split isn't stated explicitly, split among everyone mentioned or, if nobody is mentioned, everyone in the list.",
        },
        {
          role: "user",
          content: `People (id: name): ${names}\n\nBill description: ${text}`,
        },
      ],
      response_format: zodResponseFormat(aiParseResponseSchema, "bill_items"),
      max_tokens: 500,
    });

    const result = completion.choices[0]?.message.parsed;
    if (!result) {
      return NextResponse.json({ error: "Could not parse the description." }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI parse failed", error);
    return NextResponse.json({ error: "AI parsing failed." }, { status: 502 });
  }
}
