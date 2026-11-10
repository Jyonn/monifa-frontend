export type Algorithm = "SHA1" | "SHA256" | "SHA512";

export type MfaEntry = {
  id: number;
  issuer: string;
  accountName: string;
  secret: string;
  algorithm: Algorithm;
  digits: 6 | 8;
  period: number;
  createdAt: string;
  shareActive?: boolean;
};

export type SharedOtp = {
  issuer: string;
  accountName: string;
  code: string;
  remaining: number;
  period: number;
  serverTime: number;
  expiresAt: string | null;
};

export type LoginProvider = "qitian" | "frienden";
export type Identity = { provider: LoginProvider | "github"; username: string; email: string };
export type User = { id: string; displayName: string; avatarUrl: string; identities: Identity[] };
