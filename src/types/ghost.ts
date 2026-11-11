// Ghost Content API shapes (https://ghost.org/docs/content-api/), limited to the fields the app reads.
// List queries use `fields=` (see works/index.tsx), so most fields are optional: only those always returned are required.

export interface GhostTag {
   id?: string
   name: string
   slug: string
}

export interface GhostAuthor {
   id: string
   name: string
   slug?: string
   profile_image?: string | null
}

export interface GhostPost {
   id: string
   title?: string
   slug?: string
   // Computed excerpt, not returned when `fields` is used (then custom_excerpt is)
   excerpt?: string
   custom_excerpt?: string | null
   feature_image?: string | null
   url?: string
   html?: string | null
   tags?: GhostTag[]
   authors?: GhostAuthor[]
}

export interface GhostPage {
   id: string
   title?: string
   slug?: string
   html?: string | null
}

export interface GhostPagination {
   page: number
   limit: number | "all"
   pages: number
   total: number
   next: number | null
   prev: number | null
}

export interface GhostMeta {
   pagination: GhostPagination
}

// Responses: `meta` comes with browse requests (lists), not with single reads
export interface GhostPostsResponse {
   posts: GhostPost[]
   meta?: GhostMeta
}

export interface GhostAuthorsResponse {
   authors: GhostAuthor[]
   meta?: GhostMeta
}

export interface GhostPagesResponse {
   pages: GhostPage[]
   meta?: GhostMeta
}
