import { describe, expect, it } from "vitest";
import { checkRateLimit } from "../lib/rateLimit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit and then blocks", () => {
    const key = `test:${Math.random()}`;
    const results = Array.from({ length: 4 }, () => checkRateLimit(key, 3, 60_000));

    expect(results[0].allowed).toBe(true);
    expect(results[1].allowed).toBe(true);
    expect(results[2].allowed).toBe(true);
    expect(results[3].allowed).toBe(false);
    expect(results[3].remaining).toBe(0);
  });

  it("tracks separate keys independently", () => {
    const a = checkRateLimit(`test:a:${Math.random()}`, 1, 60_000);
    const b = checkRateLimit(`test:b:${Math.random()}`, 1, 60_000);

    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
  });

  it("resets the window after it expires", async () => {
    const key = `test:reset:${Math.random()}`;
    checkRateLimit(key, 1, 10);
    const blocked = checkRateLimit(key, 1, 10);
    expect(blocked.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 20));

    const afterReset = checkRateLimit(key, 1, 10);
    expect(afterReset.allowed).toBe(true);
  });
});
