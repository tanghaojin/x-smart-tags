import { selectTags } from "./shared/classification";
import type { ClassifyResult, ExtensionRequest, ExtensionResponse, PostSnapshot } from "./shared/protocol";
import { TAG_DEFINITIONS, type TagId } from "./shared/tags";

const API_URL = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

interface NoulAnswer { type: "noul"; noul: number }
interface TypeSafeResponse { model: string; answers: Record<string, NoulAnswer> }

class ApiFailure extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

chrome.action.onClicked.addListener(() => void chrome.runtime.openOptionsPage());

chrome.runtime.onMessage.addListener(
  (message: ExtensionRequest, _sender, sendResponse: (value: ExtensionResponse) => void) => {
    const response = message.type === "CLASSIFY_POST"
      ? withConcurrencyLimit(() => handleMessage(message))
      : handleMessage(message);
    void response.then(sendResponse);
    return true;
  },
);

async function withConcurrencyLimit<T>(task: () => Promise<T>): Promise<T> {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => requestQueue.push(resolve));
  }
  activeRequests += 1;
  try {
    return await task();
  } finally {
    activeRequests -= 1;
    requestQueue.shift()?.();
  }
}

async function handleMessage(message: ExtensionRequest): Promise<ExtensionResponse> {
  try {
    if (message.type === "TEST_CONNECTION") {
      const apiKey = message.apiKey?.trim() || (await getApiKey());
      if (!apiKey) return failure("CONFIG_MISSING", "请先填写 TypeSafe API Key");
      const response = await callTypeSafe(apiKey, {
        id: "connection-test",
        author: "X 智能标签",
        text: "AI tools can help developers build products.",
      }, true);
      return { ok: true, model: response.model };
    }

    if (message.type !== "CLASSIFY_POST" || !isValidPost(message.post)) {
      return failure("INVALID_REQUEST", "帖子内容格式不正确");
    }

    const apiKey = await getApiKey();
    if (!apiKey) return failure("CONFIG_MISSING", "请在扩展设置中填写 TypeSafe API Key");

    const startedAt = performance.now();
    const response = await callTypeSafe(apiKey, message.post);
    const probabilities = Object.fromEntries(
      TAG_DEFINITIONS.map(({ id }) => [id, response.answers[id]?.noul ?? 0]),
    ) as Record<TagId, number>;
    const tags = selectTags(probabilities);
    const result: ClassifyResult = {
      postId: message.post.id,
      tags,
      uncertain: tags.length === 0,
      model: response.model,
      latencyMs: Math.round(performance.now() - startedAt),
    };
    return { ok: true, result };
  } catch (error) {
    return mapFailure(error);
  }
}

async function getApiKey(): Promise<string> {
  const stored = await chrome.storage.local.get("typesafeApiKey");
  return typeof stored.typesafeApiKey === "string" ? stored.typesafeApiKey.trim() : "";
}

function isValidPost(post: PostSnapshot | undefined): post is PostSnapshot {
  return Boolean(post && typeof post.id === "string" && /^[0-9]+$/.test(post.id) &&
    typeof post.author === "string" && typeof post.text === "string" &&
    post.text.trim().length > 0 && post.text.length <= 6_000 &&
    (!post.quotedText || post.quotedText.length <= 6_000));
}

async function callTypeSafe(apiKey: string, post: PostSnapshot, connectionTest = false): Promise<TypeSafeResponse> {
  const questions = Object.fromEntries(
    (connectionTest ? TAG_DEFINITIONS.slice(0, 1) : TAG_DEFINITIONS).map((tag) => [tag.id, {
      type: "noul",
      instructions: tag.instructions,
      criteria: { true: tag.yes, false: tag.no },
    }]),
  );

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, state: { post }, questions }),
        signal: controller.signal,
      });
      if (response.ok) return (await response.json()) as TypeSafeResponse;
      if ((response.status === 429 || response.status === 529) && attempt < MAX_ATTEMPTS - 1) {
        await delay(600 * 2 ** attempt);
        continue;
      }
      throw new ApiFailure(response.status, `TypeSafe API returned ${response.status}`);
    } catch (error) {
      const transient = error instanceof TypeError || (error instanceof DOMException && error.name === "AbortError");
      if (!(error instanceof ApiFailure) && transient && attempt < MAX_ATTEMPTS - 1) {
        await delay(600 * 2 ** attempt);
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("Request attempts exhausted");
}

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function failure(code: Extract<ExtensionResponse, { ok: false }>["code"], message: string): ExtensionResponse {
  return { ok: false, code, message };
}

function mapFailure(error: unknown): ExtensionResponse {
  if (error instanceof ApiFailure) {
    if (error.status === 401 || error.status === 403) return failure("AUTH_FAILED", "API Key 无效");
    if (error.status === 429) return failure("RATE_LIMITED", "请求过多，请稍后重试");
    if (error.status === 529) return failure("SERVICE_BUSY", "TypeSafe 服务繁忙，请稍后重试");
    if (error.status === 422) return failure("INVALID_REQUEST", "TypeSafe 拒绝了分类请求");
  }
  if (error instanceof TypeError || (error instanceof DOMException && error.name === "AbortError")) {
    return failure("NETWORK_ERROR", "网络请求失败，请稍后重试");
  }
  console.error("[X Smart Tags] classification failed", error);
  return failure("UNKNOWN_ERROR", "分类暂时失败");
}
