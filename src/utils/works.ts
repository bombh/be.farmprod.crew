// Helpers for the Works list filters (Ghost posts)
// Ghost tags: the first two are internal, tags.slice(2) are "City (CC)" and the year

import type { Method } from "axios"

import type { GhostPost, GhostTag } from "@/src/types/ghost"

// Year / city filter chip of a work
export interface WorkTagChip {
   type: "year" | "city"
   slug: string
   label: string
}

const YEAR_REGEX = /^\d{4}$/

export const cleanTagName = (name?: string | null) =>
   String(name ?? "")
      .replace(/[()]/g, "")
      .trim()

export const isYearTag = (tag?: Pick<GhostTag, "name"> | null) => YEAR_REGEX.test(String(tag?.name ?? "").trim())

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
export const workDetailRequest = (id: string): [Method, string, string] => ["GET", `posts/${id}`, "include=authors"]

/**
 * Works having the given year / city tag slug (all works without slug).
 */
export const filterWorks = (posts: GhostPost[] = [], slug: string | null = null) =>
   slug ? posts.filter((post) => publicTags(post?.tags).some((tag) => tag?.slug === slug)) : posts
