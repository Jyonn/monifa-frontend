import { del, get, set } from "idb-keyval";
import type { MfaEntry } from "../types";

const entriesKey = (userId: string) => `monifa:entries:${userId}`;
const userKey = "monifa:offline-user";

export async function cacheEntries(userId: string, entries: MfaEntry[]) {
  await Promise.all([set(entriesKey(userId), entries), set(userKey, userId)]);
}

export async function loadCachedEntries(userId: string): Promise<MfaEntry[]> {
  return (await get<MfaEntry[]>(entriesKey(userId))) ?? [];
}

export async function loadOfflineUser(): Promise<string | undefined> {
  return get<string>(userKey);
}

export async function clearCache(userId?: string) {
  if (userId) await del(entriesKey(userId));
  await del(userKey);
}

