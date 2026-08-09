import * as OTPAuth from "otpauth";
import type { MfaEntry } from "../types";

export function generateCode(entry: MfaEntry, timeMs: number): string {
  return new OTPAuth.TOTP({
    issuer: entry.issuer,
    label: entry.accountName,
    algorithm: entry.algorithm,
    digits: entry.digits,
    period: entry.period,
    secret: OTPAuth.Secret.fromBase32(entry.secret)
  }).generate({ timestamp: timeMs });
}

export function secondsRemaining(period: number, timeMs: number): number {
  const seconds = Math.floor(timeMs / 1000);
  return period - (seconds % period);
}

