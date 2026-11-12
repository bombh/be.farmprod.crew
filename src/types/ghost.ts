/**
 * ghost.ts
 *
 * TypeScript shapes of the Ghost CMS Content API (https://ghost.org/docs/content-api/), limited to the fields the app
 * actually reads. Type-only file: nothing here exists at runtime.
 *
 * Role in the app: Ghost is the headless CMS. A Ghost "post" is a street-art WORK, a Ghost "author" is an ARTIST and a
 * Ghost "page" is static content (About, 20 years). These types are the generic parameters of `useAPI<T>()`
 * (hooks/useAPI.ts) and are consumed by the works list (app/(drawer)/works/index.tsx), WorkDetail
 * (screens/WorkDetail.tsx), the artists grid (app/(drawer)/artists/index.tsx), the About and 20 years screens, and
 * the cards in components/.
 *
 * How it works: list queries ask Ghost for a subset of columns with `fields=` (see works/index.tsx), so nearly every
 * field is optional: only those always returned by Ghost are required (`id`, and `name` / `slug` for tags).
 * Responses wrap the entities in an object keyed by resource name (`posts`, `authors`, `pages`) and add a `meta`
 * block only for "browse" requests (lists), never for single reads.
 */

// A Ghost tag attached to a post (used as chips / filters on works)
export interface GhostTag {
   // Ghost id, absent when the tag comes embedded with limited `fields`
   id?: string
   // Display name of the tag
   name: string
   // URL-safe identifier, used in Ghost `filter=tag:<slug>` queries
   slug: string
}

// A Ghost author = an artist of the collective
export interface GhostAuthor {
   // Ghost id
   id: string
   // Display name of the artist
   name: string
   // URL-safe identifier, used in Ghost `filter=authors:<slug>` queries
   slug?: string
   // Absolute URL of the avatar image, null when the author has none
   profile_image?: string | null
}

// A Ghost post = a work (street art piece)
export interface GhostPost {
   // Ghost id
   id: string
   // Title of the work
   title?: string
   // URL-safe identifier of the post
   slug?: string
   // Computed excerpt, not returned when `fields` is used (then custom_excerpt is)
   excerpt?: string
   // Excerpt written by hand in Ghost, null when empty
   custom_excerpt?: string | null
   // Absolute URL of the cover image, null when the post has none
   feature_image?: string | null
   // Public URL of the post on the Ghost site (used when sharing)
   url?: string
   // Full HTML body of the post (rendered by components/app/RenderHtml.tsx), only returned when requested
   html?: string | null
   // Tags of the work (only when `include=tags`)
   tags?: GhostTag[]
   // Artists of the work (only when `include=authors`)
   authors?: GhostAuthor[]
}

// A Ghost page = static content (About, 20 years)
export interface GhostPage {
   // Ghost id
   id: string
   // Title of the page
   title?: string
   // URL-safe identifier, used to fetch a page by slug
   slug?: string
   // Full HTML body of the page, null when empty
   html?: string | null
}

// Pagination block of a browse request
export interface GhostPagination {
   // Current page number (1-based)
   page: number
   // Page size requested, "all" when `limit=all`
   limit: number | "all"
   // Total number of pages
   pages: number
   // Total number of items across all pages
   total: number
   // Next page number, null on the last page
   next: number | null
   // Previous page number, null on the first page
   prev: number | null
}

// `meta` block returned by Ghost with browse requests
export interface GhostMeta {
   // Pagination info
   pagination: GhostPagination
}

// Responses: `meta` comes with browse requests (lists), not with single reads
export interface GhostPostsResponse {
   // Works returned by the request
   posts: GhostPost[]
   // Pagination info (browse requests only)
   meta?: GhostMeta
}

// Response of /authors/ (artists)
export interface GhostAuthorsResponse {
   // Artists returned by the request
   authors: GhostAuthor[]
   // Pagination info (browse requests only)
   meta?: GhostMeta
}

// Response of /pages/ (static pages)
export interface GhostPagesResponse {
   // Pages returned by the request
   pages: GhostPage[]
   // Pagination info (browse requests only)
   meta?: GhostMeta
}
