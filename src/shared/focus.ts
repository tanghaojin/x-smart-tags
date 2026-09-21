import { TAG_DEFINITIONS, type TagId } from "./tags";

export interface FocusPreferences {
  focusMode: boolean;
  selectedTagIds: TagId[];
}

export const DEFAULT_FOCUS_PREFERENCES: FocusPreferences = {
  focusMode: false,
  selectedTagIds: [],
};

const VALID_TAG_IDS = new Set<string>(TAG_DEFINITIONS.map(({ id }) => id));

export function normalizeFocusPreferences(value: Partial<FocusPreferences>): FocusPreferences {
  const selectedTagIds = Array.isArray(value.selectedTagIds)
    ? [...new Set(value.selectedTagIds.filter((id): id is TagId => typeof id === "string" && VALID_TAG_IDS.has(id)))]
    : [];
  return {
    focusMode: Boolean(value.focusMode) && selectedTagIds.length > 0,
    selectedTagIds,
  };
}

export function matchesFocus(postTagIds: TagId[], preferences: FocusPreferences): boolean {
  if (!preferences.focusMode || preferences.selectedTagIds.length === 0) return true;
  const selected = new Set(preferences.selectedTagIds);
  return postTagIds.some((id) => selected.has(id));
}
