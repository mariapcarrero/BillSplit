import { NextResponse } from "next/server";
import { billSchema } from "@/lib/schema";
import { settleBill } from "@/lib/settle";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = billSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = settleBill(parsed.data);
  return NextResponse.json(result);
}
