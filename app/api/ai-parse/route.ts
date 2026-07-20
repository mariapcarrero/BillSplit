import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { aiParseRequestSchema, aiParseResponseSchema } from "@/lib/schema";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { normalizePercentages } from "@/lib/settle";

const MODEL = "gpt-4o-mini";

// Demo-project cost guardrails — bump these if you actually need more headroom.
const PER_IP_LIMIT = 5;
const PER_IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const GLOBAL_LIMIT = 30;
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000; // 1 day

function rateLimitResponse(resetAt: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Rate limit exceeded. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = aiParseRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI parsing is not configured." }, { status: 503 });
  }

  const ip = getClientIp(request);
  const perIp = checkRateLimit(`ai-parse:ip:${ip}`, PER_IP_LIMIT, PER_IP_WINDOW_MS);
  if (!perIp.allowed) return rateLimitResponse(perIp.resetAt);

  const global = checkRateLimit("ai-parse:global", GLOBAL_LIMIT, GLOBAL_WINDOW_MS);
  if (!global.allowed) return rateLimitResponse(global.resetAt);

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
            "If the split isn't stated explicitly, split among everyone mentioned or, if nobody is mentioned, everyone in the list. " +
            'If the description gives an uneven split — percentages ("47% Maria, 53% Mateo"), ' +
            'a ratio ("60/40"), or a relative amount ("twice as much", "double") — set splitMode ' +
            'to "percentage" and splitPercentages to one { personId, share } entry per person in ' +
            "splitAmong. Those numbers don't need to add up to exactly 100 (e.g. 47 and 53 is fine); " +
            'just capture the relative proportions. Otherwise set splitMode to "equal" and ' +
            "splitPercentages to null.",
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

    const items = result.items.map(({ splitMode, splitPercentages, ...item }) => {
      if (splitMode !== "percentage") return item;

      const weights = Object.fromEntries(
        (splitPercentages ?? []).map(({ personId, share }) => [personId, share]),
      );
      return {
        ...item,
        splitMode: "percentage" as const,
        splitPercentages: normalizePercentages(item.splitAmong, weights),
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("AI parse failed", error);
    return NextResponse.json({ error: "AI parsing failed." }, { status: 502 });
  }
}
