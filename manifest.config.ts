import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "X 智能标签",
  description: "使用 TypeSafe AI 为 X 上的 AI、科技和商业内容自动添加主题标签。",
  version: "0.1.0",
  permissions: ["storage"],
  host_permissions: ["https://api.typesafe.ai/*"],
  background: { service_worker: "src/background.ts", type: "module" },
  action: { default_title: "X 智能标签专注模式", default_popup: "popup.html" },
  options_ui: { page: "options.html", open_in_tab: true },
  content_scripts: [
    {
      matches: ["https://x.com/*", "https://twitter.com/*"],
      js: ["src/content/index.ts"],
      css: ["src/content/styles.css"],
      run_at: "document_idle",
    },
  ],
});
