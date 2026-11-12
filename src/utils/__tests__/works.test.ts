/**
 * works.test.ts
 *
 * Jest unit tests (jest-expo preset) of src/utils/works.ts, the pure helpers of the Works list filters.
 * Fixtures mimic Ghost posts: two internal tags ("#work", "#farmprod") followed by the public "City (CC)" and
 * year tags.
 * - getWorkTags: public tags become `{ type, slug, label }` chips (city vs year, parentheses removed); missing tags
 *   give [].
 * - filterWorks: no slug returns everything; a year or city slug keeps only the matching works; an unknown slug
 *   returns [].
 * Run with `npm test` (watch mode) or `npx jest --ci`.
 */

/* global describe, it, expect */
import { filterWorks, getWorkTags } from "@/src/utils/works" // Helpers under test

// Builds a Ghost tag fixture
const tag = (name: string, slug: string) => ({ name, slug })
// The two internal tags every post starts with (must be ignored by the helpers)
const internal = [tag("#work", "hash-work"), tag("#farmprod", "hash-farmprod")]

// Three posts: one in Liège 2021, one in Brussels 2019, one without any tag
const posts = [
   {
      id: "1",
      title: "Wall in Liège",
      excerpt: "Big mural",
      tags: [...internal, tag("Liège (BE)", "liege-be"), tag("2021", "2021")],
   },
   {
      id: "2",
      title: "Train",
      excerpt: "Night session",
      tags: [...internal, tag("Brussels (BE)", "brussels-be"), tag("2019", "2019")],
   },
   { id: "3", title: "No tags", excerpt: "", tags: [] },
]

// Chips extracted from the tags of a work
describe("getWorkTags", () => {
   it("returns the public tags as year / city chips", () => {
      expect(getWorkTags(posts[0].tags)).toEqual([
         { type: "city", slug: "liege-be", label: "Liège BE" },
         { type: "year", slug: "2021", label: "2021" },
      ])
   })

   it("handles missing tags", () => {
      expect(getWorkTags(undefined)).toEqual([])
   })
})

// Filtering of a list of works by tag slug
describe("filterWorks", () => {
   it("returns everything without filter", () => {
      expect(filterWorks(posts)).toHaveLength(3)
   })

   it("filters by year or city slug", () => {
      expect(filterWorks(posts, "2021").map((p) => p.id)).toEqual(["1"])
      expect(filterWorks(posts, "brussels-be").map((p) => p.id)).toEqual(["2"])
      expect(filterWorks(posts, "dakar-sn")).toEqual([])
   })
})
