import "./styles.css";
import { DEFAULT_FOCUS_PREFERENCES, normalizeFocusPreferences } from "../shared/focus";
import { TAG_DEFINITIONS, type TagId } from "../shared/tags";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing app root");

app.innerHTML = `
  <section class="popup-shell">
    <header>
      <div><span class="signal"></span><strong>X 智能标签</strong></div>
      <button id="settings" type="button" aria-label="打开 API 设置">设置</button>
    </header>
    <section class="mode-row">
      <div><h1>专注模式</h1><p>只展开命中所选标签的帖子</p></div>
      <label class="switch"><input id="focus-mode" type="checkbox" /><span></span></label>
    </section>
    <div class="section-title"><span>关注标签</span><span id="count">已选 0 项</span></div>
    <div id="tags" class="tag-grid">
      ${TAG_DEFINITIONS.map((tag) => `<label class="tag-option tag-${tag.color}"><input type="checkbox" value="${tag.id}" /><span>${tag.label}</span></label>`).join("")}
    </div>
    <p id="hint">至少选择一个标签后才能开启专注模式。</p>
  </section>`;

const focusToggle = document.querySelector<HTMLInputElement>("#focus-mode")!;
const count = document.querySelector<HTMLElement>("#count")!;
const hint = document.querySelector<HTMLElement>("#hint")!;
const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>('#tags input[type="checkbox"]'));

void loadPreferences();

async function loadPreferences() {
  const stored = await chrome.storage.local.get(["focusMode", "selectedTagIds"]);
  const preferences = normalizeFocusPreferences({
    focusMode: typeof stored.focusMode === "boolean" ? stored.focusMode : DEFAULT_FOCUS_PREFERENCES.focusMode,
    selectedTagIds: Array.isArray(stored.selectedTagIds) ? stored.selectedTagIds as TagId[] : DEFAULT_FOCUS_PREFERENCES.selectedTagIds,
  });
  focusToggle.checked = preferences.focusMode;
  for (const checkbox of checkboxes) checkbox.checked = preferences.selectedTagIds.includes(checkbox.value as TagId);
  updatePresentation();
}

for (const checkbox of checkboxes) checkbox.addEventListener("change", () => void savePreferences());
focusToggle.addEventListener("change", () => void savePreferences());
document.querySelector("#settings")?.addEventListener("click", () => void chrome.runtime.openOptionsPage());

function selectedTagIds(): TagId[] {
  return checkboxes.filter(({ checked }) => checked).map(({ value }) => value as TagId);
}

async function savePreferences() {
  const selected = selectedTagIds();
  if (selected.length === 0) focusToggle.checked = false;
  const preferences = normalizeFocusPreferences({ focusMode: focusToggle.checked, selectedTagIds: selected });
  await chrome.storage.local.set(preferences);
  updatePresentation();
}

function updatePresentation() {
  const selectedCount = selectedTagIds().length;
  count.textContent = `已选 ${selectedCount} 项`;
  focusToggle.disabled = selectedCount === 0;
  hint.textContent = selectedCount === 0
    ? "至少选择一个标签后才能开启专注模式。"
    : focusToggle.checked
      ? "专注模式已生效，未命中的帖子会折叠。"
      : "标签已保存，开启开关后开始过滤。";
  hint.dataset.active = String(focusToggle.checked);
}
