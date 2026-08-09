import * as OTPAuth from "otpauth";
import type { Algorithm, MfaEntry } from "../types";

export type EntryDraft = Omit<MfaEntry, "id" | "createdAt">;

export function parseOtpUri(value: string): EntryDraft {
  const parsed = OTPAuth.URI.parse(value.trim());
  if (!(parsed instanceof OTPAuth.TOTP)) throw new Error("仅支持 TOTP 二维码");
  const algorithm = parsed.algorithm.toUpperCase() as Algorithm;
  if (!["SHA1", "SHA256", "SHA512"].includes(algorithm)) throw new Error("不支持该算法");
  if (![6, 8].includes(parsed.digits)) throw new Error("仅支持 6 位或 8 位验证码");
  return {
    issuer: parsed.issuer || "未命名服务",
    accountName: parsed.label || "未命名账户",
    secret: parsed.secret.base32.replace(/=+$/g, ""),
    algorithm,
    digits: parsed.digits as 6 | 8,
    period: parsed.period
  };
}

export function normalizeManualDraft(input: EntryDraft): EntryDraft {
  const secret = input.secret.replace(/[\s-]/g, "").toUpperCase().replace(/=+$/g, "");
  if (!/^[A-Z2-7]+$/.test(secret)) throw new Error("Key 不是有效的 Base32 字符串");
  if (!input.issuer.trim() || !input.accountName.trim()) throw new Error("请填写服务商和账户名");
  return { ...input, issuer: input.issuer.trim(), accountName: input.accountName.trim(), secret };
}

