// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { extractPost } from "../src/content/extract";

describe("X post extraction", () => {
  it("extracts the status id, author, primary text and quote", () => {
    document.body.innerHTML = `<article data-testid="tweet"><a href="/alice/status/123456"><time>now</time></a><div data-testid="tweetText" lang="en">New AI tool</div><div data-testid="quoteTweet"><div data-testid="tweetText">Quoted context</div></div></article>`;
    expect(extractPost(document.querySelector("article") as HTMLElement)).toEqual({ id: "123456", author: "alice", text: "New AI tool", quotedText: "Quoted context", languageHint: "en" });
  });
  it("ignores cards without a canonical timestamp link", () => {
    document.body.innerHTML = `<article data-testid="tweet"><div data-testid="tweetText">Ad</div></article>`;
    expect(extractPost(document.querySelector("article") as HTMLElement)).toBeNull();
  });
});
