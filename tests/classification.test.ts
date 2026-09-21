import { describe, expect, it } from "vitest";
import { cleanPostText, selectTags, splitVisibleTags } from "../src/shared/classification";
import { matchesFocus, normalizeFocusPreferences } from "../src/shared/focus";
import { TAG_BY_ID } from "../src/shared/tags";

describe("classification policy", () => {
  it("keeps overlapping tags at or above the threshold and sorts them", () => {
    expect(selectTags({ ai: .91, monetization: .7, technology: .69 })).toEqual([
      { id: "ai", probability: .91 }, { id: "monetization", probability: .7 },
    ]);
  });
  it("splits the first three visible labels from overflow", () => {
    const { visible, hidden } = splitVisibleTags(selectTags({ ai: .95, tutorial: .9, social_growth: .85, technology: .8 }));
    expect(visible).toHaveLength(3); expect(hidden).toHaveLength(1);
  });
  it("normalizes whitespace and enforces the input limit", () => {
    expect(cleanPostText("  AI\n\n  tools  ")).toBe("AI tools"); expect(cleanPostText("abcdef", 4)).toBe("abcd");
  });

  it("keeps only posts matching one of the selected focus tags", () => {
    const preferences = normalizeFocusPreferences({ focusMode: true, selectedTagIds: ["ai", "tutorial", "ai"] });
    expect(preferences.selectedTagIds).toEqual(["ai", "tutorial"]);
    expect(matchesFocus(["ai", "product_launch"], preferences)).toBe(true);
    expect(matchesFocus(["industry_news"], preferences)).toBe(false);
  });

  it("turns focus mode off when no valid tag is selected", () => {
    const preferences = normalizeFocusPreferences({ focusMode: true, selectedTagIds: [] });
    expect(preferences.focusMode).toBe(false);
    expect(matchesFocus([], preferences)).toBe(true);
  });

  it("defines social growth to include account growth cases without requiring a tutorial", () => {
    expect(TAG_BY_ID.social_growth.instructions).toContain("运营案例");
    expect(TAG_BY_ID.social_growth.yes).toContain("不要求提供完整教程");
    expect(TAG_BY_ID.social_growth.yes).toContain("抖音");
  });

  it("defines AI and developer tools to include substantive cases without requiring them to be the sole topic", () => {
    expect(TAG_BY_ID.ai.yes).toContain("AI 不必是唯一主题");
    expect(TAG_BY_ID.ai.yes).toContain("AI 生成视频");
    expect(TAG_BY_ID.developer_tools.yes).toContain("开发案例");
    expect(TAG_BY_ID.developer_tools.yes).toContain("不要求提供完整教程");
  });
});
