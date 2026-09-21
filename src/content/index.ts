import { splitVisibleTags } from "../shared/classification";
import { DEFAULT_FOCUS_PREFERENCES, matchesFocus, normalizeFocusPreferences, type FocusPreferences } from "../shared/focus";
import type { ClassifyResult, ExtensionResponse, PostSnapshot } from "../shared/protocol";
import { TAG_BY_ID, TAG_DEFINITIONS, type TagId } from "../shared/tags";
import { extractPost } from "./extract";

interface ViewState { result?: ClassifyResult; manualTags?: Set<TagId>; error?: Extract<ExtensionResponse, { ok: false }>; post?: PostSnapshot; expanded?: boolean }
const observed = new WeakSet<HTMLElement>();
const activeArticles = new Set<HTMLElement>();
const postRequests = new Map<string, Promise<ExtensionResponse>>();
const stateByArticle = new WeakMap<HTMLElement, ViewState>();
let activePopover: HTMLElement | null = null;
let focusPreferences: FocusPreferences = DEFAULT_FOCUS_PREFERENCES;

const viewportObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const article = entry.target as HTMLElement;
    viewportObserver.unobserve(article);
    void classifyArticle(article);
  }
}, { rootMargin: "400px 0px" });

function discoverPosts(root: ParentNode = document) {
  const articles = root instanceof HTMLElement && root.matches('article[data-testid="tweet"]')
    ? [root]
    : Array.from(root.querySelectorAll<HTMLElement>('article[data-testid="tweet"]'));
  for (const article of articles) {
    if (observed.has(article) || article.closest('[data-testid="placementTracking"]')) continue;
    observed.add(article);
    activeArticles.add(article);
    viewportObserver.observe(article);
  }
}

async function classifyArticle(article: HTMLElement) {
  const post = extractPost(article);
  if (!post) return;
  stateByArticle.set(article, { post });
  render(article, { status: "loading" });
  const cacheKey = `${post.id}:${post.text}:${post.quotedText ?? ""}`;
  let request = postRequests.get(cacheKey);
  if (!request) {
    request = chrome.runtime.sendMessage({ type: "CLASSIFY_POST", post });
    postRequests.set(cacheKey, request);
  }
  const response = await request;
  if (response.ok && "result" in response) {
    const state: ViewState = { result: response.result, post };
    stateByArticle.set(article, state);
    render(article, { status: "ready", state, post });
  } else if (!response.ok) {
    const state: ViewState = { error: response, post };
    stateByArticle.set(article, state);
    render(article, { status: "error", state, post });
  }
}

type RenderInput = { status: "loading" } | { status: "ready" | "error"; state: ViewState; post: PostSnapshot };

function render(article: HTMLElement, input: RenderInput) {
  article.dataset.typesafeTags = "true";
  if (input.status !== "ready") article.classList.remove("tsai-focus-collapsed");
  let root = article.querySelector<HTMLElement>(":scope > .tsai-root");
  if (!root) { root = document.createElement("div"); root.className = "tsai-root"; article.append(root); }
  root.replaceChildren();
  if (input.status === "loading") { root.append(createPill("分类中", "loading")); return; }
  if (input.status === "error") {
    const label = input.state.error?.code === "CONFIG_MISSING" ? "需要设置" : "稍后重试";
    const button = createPill(label, "error");
    button.title = input.state.error?.message ?? "分类失败";
    button.addEventListener("click", () => {
      if (input.state.error?.code === "CONFIG_MISSING") void chrome.runtime.openOptionsPage();
      else { postRequests.delete(`${input.post.id}:${input.post.text}:${input.post.quotedText ?? ""}`); void classifyArticle(article); }
    });
    root.append(button);
    return;
  }

  const selected = input.state.manualTags
    ? Array.from(input.state.manualTags).map((id) => ({ id, probability: 1 }))
    : input.state.result?.tags ?? [];
  const isFocused = matchesFocus(selected.map(({ id }) => id), focusPreferences);
  if (focusPreferences.focusMode && !isFocused && !input.state.expanded) {
    article.classList.add("tsai-focus-collapsed");
    const reveal = createPill("未命中关注标签 · 展开", "focus-hidden");
    reveal.addEventListener("click", () => {
      input.state.expanded = true;
      render(article, { status: "ready", state: input.state, post: input.post });
    });
    root.append(reveal);
    return;
  }
  article.classList.remove("tsai-focus-collapsed");
  const { visible, hidden } = splitVisibleTags(selected);
  if (visible.length === 0) {
    const uncertain = createPill("待确认", "uncertain");
    uncertain.addEventListener("click", () => openEditor(article, root!, input.state, input.post));
    root.append(uncertain);
    return;
  }
  for (const tag of visible) {
    const definition = TAG_BY_ID[tag.id];
    const pill = createPill(definition.label, definition.color);
    pill.title = input.state.manualTags ? "人工标签" : `匹配概率 ${Math.round(tag.probability * 100)}%`;
    pill.addEventListener("click", () => openEditor(article, root!, input.state, input.post));
    root.append(pill);
  }
  if (hidden.length > 0) {
    const more = createPill(`+${hidden.length}`, "more");
    more.title = hidden.map(({ id }) => TAG_BY_ID[id].label).join("、");
    more.addEventListener("click", () => openEditor(article, root!, input.state, input.post));
    root.append(more);
  }
}

function createPill(label: string, color: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `tsai-pill tsai-${color}`;
  button.textContent = label;
  return button;
}

function openEditor(article: HTMLElement, root: HTMLElement, state: ViewState, post: PostSnapshot) {
  activePopover?.remove();
  const selected = state.manualTags ?? new Set(state.result?.tags.map(({ id }) => id) ?? []);
  const popover = document.createElement("div");
  popover.className = "tsai-popover";
  popover.addEventListener("click", (event) => event.stopPropagation());
  const heading = document.createElement("strong");
  heading.textContent = "调整本次页面的标签";
  popover.append(heading);
  for (const tag of TAG_DEFINITIONS) {
    const label = document.createElement("label"); label.className = "tsai-option";
    const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = selected.has(tag.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selected.add(tag.id); else selected.delete(tag.id);
      state.manualTags = selected; stateByArticle.set(article, state);
      render(article, { status: "ready", state, post });
      popover.remove(); activePopover = null;
    });
    const text = document.createElement("span"); text.textContent = tag.label;
    label.append(checkbox, text); popover.append(label);
  }
  root.append(popover); activePopover = popover;
  setTimeout(() => document.addEventListener("click", closePopover, { once: true }), 0);
}

function closePopover() { activePopover?.remove(); activePopover = null; }

const mutationObserver = new MutationObserver((records) => {
  for (const record of records) for (const node of record.addedNodes) if (node instanceof HTMLElement) discoverPosts(node);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || (!changes.focusMode && !changes.selectedTagIds)) return;
  focusPreferences = normalizeFocusPreferences({
    focusMode: typeof changes.focusMode?.newValue === "boolean" ? changes.focusMode.newValue : focusPreferences.focusMode,
    selectedTagIds: Array.isArray(changes.selectedTagIds?.newValue) ? changes.selectedTagIds.newValue as TagId[] : focusPreferences.selectedTagIds,
  });
  rerenderForFocusChange();
});

function rerenderForFocusChange() {
  for (const article of activeArticles) {
    if (!article.isConnected) { activeArticles.delete(article); continue; }
    const state = stateByArticle.get(article);
    if (!state?.post) continue;
    state.expanded = false;
    if (state.result) render(article, { status: "ready", state, post: state.post });
    else if (state.error) render(article, { status: "error", state, post: state.post });
  }
}

async function initialize() {
  const stored = await chrome.storage.local.get(["focusMode", "selectedTagIds"]);
  focusPreferences = normalizeFocusPreferences({
    focusMode: typeof stored.focusMode === "boolean" ? stored.focusMode : undefined,
    selectedTagIds: Array.isArray(stored.selectedTagIds) ? stored.selectedTagIds as TagId[] : undefined,
  });
  discoverPosts();
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

void initialize();
