import { describe, expect, it } from "vitest";
import { generateCode, secondsRemaining } from "./totp";

describe("TOTP generation", () => {
  const entry = { id: 1, issuer: "Test", accountName: "alice", secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", algorithm: "SHA1" as const, digits: 8 as const, period: 30, createdAt: "" };

  it("matches RFC 6238 SHA-1 vector", () => {
    expect(generateCode(entry, 59_000)).toBe("94287082");
  });

  it("reports the stable remaining seconds", () => {
    expect(secondsRemaining(30, 1_000)).toBe(29);
  });
});

