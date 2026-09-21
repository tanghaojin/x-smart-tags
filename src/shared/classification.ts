import { CLASSIFICATION_THRESHOLD, MAX_VISIBLE_TAGS, TAG_DEFINITIONS, type TagId } from "./tags";
import type { ClassifiedTag } from "./protocol";

export function selectTags(probabilities: Partial<Record<TagId, number>>, threshold = CLASSIFICATION_THRESHOLD): ClassifiedTag[] {
  return TAG_DEFINITIONS.map(({ id }) => ({ id, probability: probabilities[id] ?? 0 }))
    .filter(({ probability }) => probability >= threshold)
    .sort((a, b) => b.probability - a.probability);
}

export function splitVisibleTags(tags: ClassifiedTag[], limit = MAX_VISIBLE_TAGS) {
  return { visible: tags.slice(0, limit), hidden: tags.slice(limit) };
}

export function cleanPostText(value: string, maxLength = 6_000): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}
