import "./styles.css";
import type { ExtensionResponse } from "../shared/protocol";
import { TAG_DEFINITIONS } from "../shared/tags";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing app root");

app.innerHTML = `
  <section class="shell">
    <header class="hero">
      <div class="eyebrow"><span></span>X SMART TAGS</div>
      <h1>把值得写的帖子，<br />在浏览时就分好类。</h1>
      <p>插件只把当前可见的帖子正文发送给 TypeSafe AI。API Key 保存在本机 Chrome 扩展存储中。</p>
    </header>
    <section class="panel" aria-labelledby="api-heading">
      <div class="panel-heading"><div><span class="step">01</span><h2 id="api-heading">连接 TypeSafe AI</h2></div><span class="local-badge">仅本机</span></div>
      <label class="field" for="api-key"><span>API KEY</span><div class="input-row"><input id="api-key" type="password" autocomplete="off" spellcheck="false" placeholder="ts_••••••••••••••••" /><button id="toggle-key" type="button" class="quiet-button">显示</button></div></label>
      <div class="actions"><button id="save" type="button" class="primary-button">保存并测试连接</button><span id="status" role="status" aria-live="polite"></span></div>
      <p class="notice">API Key 对安装此扩展的人可见。此版本适合使用个人 Key 的本地安装，不应把含有共享 Key 的安装包公开发布。</p>
    </section>
    <section class="panel" aria-labelledby="tags-heading">
      <div class="panel-heading"><div><span class="step">02</span><h2 id="tags-heading">自动识别 10 类内容</h2></div></div>
      <div class="tag-grid">${TAG_DEFINITIONS.map((tag) => `<div class="tag-card"><i class="dot dot-${tag.color}"></i><span>${tag.label}</span></div>`).join("")}</div>
      <p class="footnote">同一帖子可以拥有多个标签。匹配概率低于 70% 时显示“待确认”，点击标签即可在当前页面手动调整。</p>
    </section>
  </section>`;

const keyInput = document.querySelector<HTMLInputElement>("#api-key")!;
const toggleButton = document.querySelector<HTMLButtonElement>("#toggle-key")!;
const saveButton = document.querySelector<HTMLButtonElement>("#save")!;
const status = document.querySelector<HTMLElement>("#status")!;

void chrome.storage.local.get("typesafeApiKey").then((stored) => {
  if (typeof stored.typesafeApiKey === "string") keyInput.value = stored.typesafeApiKey;
});

toggleButton.addEventListener("click", () => {
  const visible = keyInput.type === "text";
  keyInput.type = visible ? "password" : "text";
  toggleButton.textContent = visible ? "显示" : "隐藏";
});

saveButton.addEventListener("click", async () => {
  const apiKey = keyInput.value.trim();
  if (!apiKey) { setStatus("请输入 API Key", "error"); keyInput.focus(); return; }
  saveButton.disabled = true;
  setStatus("正在验证…", "pending");
  try {
    const response: ExtensionResponse = await chrome.runtime.sendMessage({ type: "TEST_CONNECTION", apiKey });
    if (!response.ok) { setStatus(response.message, "error"); return; }
    if (!("model" in response)) { setStatus("连接测试返回了意外结果", "error"); return; }
    await chrome.storage.local.set({ typesafeApiKey: apiKey });
    setStatus(`连接成功 · ${response.model}`, "success");
  } catch { setStatus("扩展服务暂时没有响应", "error"); }
  finally { saveButton.disabled = false; }
});

function setStatus(message: string, tone: "pending" | "success" | "error") {
  status.textContent = message; status.dataset.tone = tone;
}
