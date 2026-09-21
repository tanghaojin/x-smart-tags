# X Smart Tags

[简体中文](README.md) | **English**

Automatically identify topics in X posts with [TypeSafe AI](https://typesafe.ai/), then use Focus Mode to collapse content that does not match your current interests.

![X Smart Tags showing the Social Growth tag in the X timeline](docs/images/x-smart-tags-feed.png)

> Tags appear in the upper-right corner of each post. The screenshot highlights the “Social Growth” and “Analysis” tags.

## Features

- Adds multi-label classification to posts on `x.com` and `twitter.com`.
- Includes 10 built-in categories: AI, Technology, Developer Tools, Product Launches, Industry News, Tutorials, Analysis, Product & Startups, Monetization, and Social Growth.
- A post can match multiple labels. Results below the `0.70` threshold are shown as “Needs review.”
- Select any number of the 10 labels. Focus Mode collapses posts that do not match and keeps a per-post expand control.
- Supports Home, Search, profiles, Bookmarks, post detail pages, SPA navigation, and infinite scrolling.
- Classifies Chinese, English, and mixed-language posts.
- Post text, classification results, and manual adjustments are not persisted.

## Local Installation

Requires Node.js 20+ and pnpm.

```powershell
pnpm install
pnpm test
pnpm build
```

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project's `dist` directory.
5. Open the extension's options page, enter your own TypeSafe API Key, and test the connection.
6. Click the extension icon in the toolbar, select the labels you want to follow, and enable Focus Mode.

## API Key and Privacy

- The API Key is stored in `chrome.storage.local`; it is never written to project files.
- Chrome extension storage is not a secure vault. Anyone with access to the browser profile or extension code may still be able to read the Key. Use your own Key and never bundle a shared Key in a public release.
- The extension calls `https://api.typesafe.ai/v1/systemone` directly from its Background Service Worker.
- Only posts near the viewport with extractable text are sent for classification. Images, videos, and linked article bodies are not read.
- `api-key.txt`, `.env*`, build output, and local experiment directories are excluded through `.gitignore`.

## Development

```powershell
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

Main directories:

- `src/background.ts`: TypeSafe requests, retries, and concurrency limits.
- `src/content/`: X post detection, tag rendering, and Focus Mode.
- `src/popup/`: quick controls for followed labels and Focus Mode.
- `src/options/`: API Key settings and connection testing.
- `src/shared/`: labels, classification policy, message protocol, and shared types.

## License

[MIT](LICENSE)
