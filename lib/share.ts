import type { Bill } from "./types";
import { billSchema } from "./schema";

const BASE64URL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function bytesToBase64url(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const triplet = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);

    result += BASE64URL_CHARS[(triplet >> 18) & 0x3f];
    result += BASE64URL_CHARS[(triplet >> 12) & 0x3f];
    result += b1 !== undefined ? BASE64URL_CHARS[(triplet >> 6) & 0x3f] : "";
    result += b2 !== undefined ? BASE64URL_CHARS[triplet & 0x3f] : "";
  }
  return result;
}

function base64urlToBytes(input: string): Uint8Array {
  const lookup = new Map(BASE64URL_CHARS.split("").map((c, i) => [c, i]));
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of input) {
    const value = lookup.get(char);
    if (value === undefined) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

export function encodeBillToken(bill: Bill): string {
  const json = JSON.stringify(bill);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64url(bytes);
}

export function decodeBillToken(token: string): Bill | null {
  try {
    const bytes = base64urlToBytes(token);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    return billSchema.parse(parsed);
  } catch {
    return null;
  }
}
