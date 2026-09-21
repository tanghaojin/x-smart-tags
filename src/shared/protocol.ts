import type { TagId } from "./tags";

export interface PostSnapshot { id: string; author: string; text: string; quotedText?: string; languageHint?: string }
export interface ClassifiedTag { id: TagId; probability: number }
export interface ClassifyResult { postId: string; tags: ClassifiedTag[]; uncertain: boolean; model: string; latencyMs: number }
export type ExtensionRequest = { type: "CLASSIFY_POST"; post: PostSnapshot } | { type: "TEST_CONNECTION"; apiKey?: string };
export type ExtensionResponse =
  | { ok: true; result: ClassifyResult }
  | { ok: true; model: string }
  | { ok: false; code: "CONFIG_MISSING" | "AUTH_FAILED" | "RATE_LIMITED" | "SERVICE_BUSY" | "INVALID_REQUEST" | "NETWORK_ERROR" | "UNKNOWN_ERROR"; message: string };
