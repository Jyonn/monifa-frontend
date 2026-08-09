import { describe, expect, it } from "vitest";
import { normalizeManualDraft, parseOtpUri } from "./parse";

describe("TOTP input", () => {
  it("parses a standard otpauth URI", () => {
    const entry = parseOtpUri("otpauth://totp/GitHub:alice?secret=JBSWY3DPEHPK3PXP&issuer=GitHub");
    expect(entry.issuer).toBe("GitHub");
    expect(entry.accountName).toBe("alice");
    expect(entry.digits).toBe(6);
  });

  it("normalizes a manual key", () => {
    const entry = normalizeManualDraft({ issuer: " GitHub ", accountName: " alice ", secret: "jbsw-y3dp ehpk3pxp", algorithm: "SHA1", digits: 6, period: 30 });
    expect(entry.secret).toBe("JBSWY3DPEHPK3PXP");
    expect(entry.accountName).toBe("alice");
  });

  it("rejects HOTP", () => {
    expect(() => parseOtpUri("otpauth://hotp/Test:alice?secret=JBSWY3DPEHPK3PXP&counter=1")).toThrow();
  });
});
