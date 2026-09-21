# X Smart Tags

**简体中文** | [English](README_EN.md)

使用 [TypeSafe AI](https://typesafe.ai/) 自动识别 X 帖子主题，并通过专注模式折叠与当前关注方向无关的内容。

![X Smart Tags 在 X 信息流中显示“社媒增长”标签](docs/images/x-smart-tags-feed.png)

> 标签显示在帖子的右上角；截图中突出展示了“社媒增长”和“观点分析”标签。

## 功能

- 为 `x.com` 和 `twitter.com` 中的帖子添加多标签分类。
- 内置 AI、科技、开发工具、新品发布、行业资讯、教程方法、观点分析、产品创业、赚钱商业化和社媒增长 10 类标签。
- 一条帖子可以同时命中多个标签；低于 `0.70` 阈值时显示“待确认”。
- 从 10 类中任选 N 个关注标签，专注模式会折叠未命中的帖子并保留单帖展开入口。
- 支持首页、搜索、用户主页、书签、帖子详情、SPA 路由和无限滚动。
- 中文、英文及中英混合内容均可参与分类。
- 帖子正文、分类结果和人工调整不会写入持久存储。

## 本地安装

需要 Node.js 20+ 和 pnpm。

```powershell
pnpm install
pnpm test
pnpm build
```

1. 打开 `chrome://extensions`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择项目的 `dist` 目录。
5. 在扩展详情中打开“扩展程序选项”，填写自己的 TypeSafe API Key 并测试连接。
6. 点击工具栏中的扩展图标，选择关注标签并开启专注模式。

## API Key 与隐私

- API Key 保存在 `chrome.storage.local`，不会写入项目文件。
- Chrome 扩展的本地存储不是密钥保险箱，能够访问浏览器配置或扩展代码的人仍可能读取 Key。请使用自己的 Key，不要把共享 Key 内置到公开安装包。
- 扩展通过 Background Service Worker 直接调用 `https://api.typesafe.ai/v1/systemone`。
- 只有进入视口附近且可提取正文的帖子会被发送分类；图片、视频和外链正文不会被读取。
- `api-key.txt`、`.env*`、构建产物和本机实验目录已加入 `.gitignore`。

## 开发

```powershell
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

主要目录：

- `src/background.ts`：TypeSafe 请求、重试与并发限制。
- `src/content/`：X 帖子识别、标签渲染和专注模式。
- `src/popup/`：关注标签与专注模式快捷面板。
- `src/options/`：API Key 设置和连接测试。
- `src/shared/`：标签、分类策略、消息协议和共享类型。

## 开源协议

[MIT](LICENSE)
