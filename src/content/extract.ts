import { cleanPostText } from "../shared/classification";
import type { PostSnapshot } from "../shared/protocol";

const STATUS_PATTERN = /\/(?:[^/]+)\/status\/(\d+)/;

export function extractPost(article: HTMLElement): PostSnapshot | null {
  const statusLink = Array.from(article.querySelectorAll<HTMLAnchorElement>('a[href*="/status/"]'))
    .map((link) => ({ link, match: link.getAttribute("href")?.match(STATUS_PATTERN) }))
    .find(({ link, match }) => match && link.querySelector("time"));
  const id = statusLink?.match?.[1];
  if (!id) return null;

  const textElements = Array.from(article.querySelectorAll<HTMLElement>('[data-testid="tweetText"]'));
  const primaryText = textElements[0];
  if (!primaryText) return null;
  const text = cleanPostText(primaryText.innerText || primaryText.textContent || "");
  if (!text) return null;

  const quotedText = textElements[1] ? cleanPostText(textElements[1].innerText || textElements[1].textContent || "") : undefined;
  const authorPath = statusLink.link.getAttribute("href") ?? "";
  const author = authorPath.split("/").filter(Boolean)[0] ?? "unknown";
  return { id, author, text, ...(quotedText ? { quotedText } : {}), languageHint: primaryText.getAttribute("lang") || document.documentElement.lang || undefined };
}
