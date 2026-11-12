/**
 * works.ts
 *
 * Helpers around Ghost posts (= works) for the Works list filters and the Work detail screen.
 *
 * Ghost tag convention of the Farm Prod site: the first two tags of a post are internal (hash tags like "#work"),
 * the following ones are the PUBLIC tags: a city written "City (CC)" and a 4-digit year. `getWorkTags` turns those
 * public tags into filter chips (type "year" or "city"), `filterWorks` keeps the works having a tag slug, and
 * `workDetailRequest` builds the Ghost request of one work so the detail screen and the prefetch done when a card is
 * pressed share the same react-query cache entry.
 *
 * Used by: app/(drawer)/works/index.tsx (filtering), components/WorkCard.tsx and screens/WorkDetail.tsx (chips,
 * detail request), components/app/TagChips.tsx. Unit tested in utils/__tests__/works.test.ts.
 */

// Helpers for the Works list filters (Ghost posts)
// Ghost tags: the first two are internal, tags.slice(2) are "City (CC)" and the year

import type { Method } from "axios" // HTTP method type of the useAPI request tuple

import type { GhostPost, GhostTag } from "@/src/types/ghost" // Ghost types: a work and its tags

// Year / city filter chip of a work
// Year / city filter chip of a work (shape consumed by TagChips)
export interface WorkTagChip {
   // Kind of chip: a 4-digit year or a city
   type: "year" | "city"
   // Ghost tag slug, used as the filter value
   slug: string
   // Text displayed on the chip (parentheses removed)
   label: string
}

// A year tag is exactly 4 digits
const YEAR_REGEX = /^\d{4}$/

// Display name of a tag: "Liège (BE)" -> "Liège BE" (parentheses dropped, trimmed); null-safe
export const cleanTagName = (name?: string | null) =>
   String(name ?? "")
      .replace(/[()]/g, "")
      .trim()

// True when the tag name is a 4-digit year like "2021"
export const isYearTag = (tag?: Pick<GhostTag, "name"> | null) => YEAR_REGEX.test(String(tag?.name ?? "").trim())

// Public tags of a post: skips the two internal ones; [] when tags is missing
const publicTags = (tags?: GhostTag[] | null) => (Array.isArray(tags) ? tags.slice(2) : [])

/**
 * Year / city tags of a work, as filter chips: [{ type: "year" | "city", slug, label }]
 */
export const getWorkTags = (tags?: GhostTag[] | null): WorkTagChip[] =>
   publicTags(tags)
      .filter((tag) => tag?.slug && cleanTagName(tag.name))
      .map((tag) => ({ type: isYearTag(tag) ? "year" : "city", slug: tag.slug, label: cleanTagName(tag.name) }))

// Ghost request of a work detail page: shared by the detail screen and the prefetch on card press,
// so both use the same cache entry
// Returns the [method, endpoint, query] tuple for useAPI; id = Ghost post id
export const workDetailRequest = (id: string): [Method, string, string] => ["GET", `posts/${id}`, "include=authors"]

/**
 * Works having the given year / city tag slug (all works without slug).
 */
export const filterWorks = (posts: GhostPost[] = [], slug: string | null = null) =>
   slug ? posts.filter((post) => publicTags(post?.tags).some((tag) => tag?.slug === slug)) : posts
