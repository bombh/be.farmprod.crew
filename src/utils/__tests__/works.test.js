/* global describe, it, expect */
import { filterWorks, getWorkTags } from "@/src/utils/works"

const tag = (name, slug) => ({ name, slug })
const internal = [tag("#work", "hash-work"), tag("#farmprod", "hash-farmprod")]

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
