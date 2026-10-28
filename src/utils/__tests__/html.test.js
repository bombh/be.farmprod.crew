/* global describe, it, expect */
import {
   cleanHtml,
   decodeEntities,
   getImages,
   getImageSrc,
   getImageURI,
   getTagAttribute,
   getTagContent,
   getTagName,
} from "@/src/utils/html"

const BASE = "https://www.farmprod.be/content/images"

// Realistic Ghost image card
const imageCard = (path, caption = "") =>
   `<figure class="kg-card kg-image-card${caption ? " kg-card-hascaption" : ""}">` +
   `<img src="${BASE}/${path}" class="kg-image" alt="" loading="lazy" width="2000" height="1333" ` +
   `srcset="${BASE}/size/w600/${path} 600w, ${BASE}/size/w1000/${path} 1000w, ${BASE}/size/w1600/${path} 1600w, ${BASE}/${path} 2000w" ` +
   `sizes="(min-width: 720px) 720px">` +
   (caption ? `<figcaption><span style="white-space: pre-wrap;">${caption}</span></figcaption>` : "") +
   `</figure>`

describe("cleanHtml", () => {
   it("returns an empty array for empty or invalid input", () => {
      expect(cleanHtml(undefined)).toEqual([])
      expect(cleanHtml(null)).toEqual([])
      expect(cleanHtml("")).toEqual([])
      expect(cleanHtml(42)).toEqual([])
   })

   it("keeps simple paragraphs unchanged", () => {
      expect(cleanHtml("<p>Hello world</p><p>Second paragraph</p>")).toEqual([
         "<p>Hello world</p>",
         "<p>Second paragraph</p>",
      ])
   })

   it("turns a Ghost image card into a single w600 <img> tag, without srcset or caption", () => {
      const result = cleanHtml(imageCard("2023/05/wall.jpg", "Photo by Farm Prod"))
      expect(result).toEqual([`<img src="${BASE}/size/w600/2023/05/wall.jpg">`])
   })

   it("does not resize an already sized image twice", () => {
      const html = `<img src="${BASE}/size/w2000/2023/05/wall.jpg">`
      expect(cleanHtml(html)).toEqual([`<img src="${BASE}/size/w600/2023/05/wall.jpg">`])
   })

   it("keeps the text of links, strong and em inside paragraphs", () => {
      const html =
         '<p>Painted by <a href="https://www.instagram.com/farmprod/" rel="noreferrer">Farm Prod</a> ' +
         "with <strong>Ozie</strong> and <em>Nean</em>.</p>"
      expect(cleanHtml(html)).toEqual(["<p>Painted by Farm Prod with Ozie and Nean.</p>"])
   })

   it("handles nested inline tags", () => {
      const html = "<p><strong>Bold <em>and italic</em></strong> text</p>"
      expect(cleanHtml(html)).toEqual(["<p>Bold and italic text</p>"])
   })

   it("decodes entities in text", () => {
      const html = "<p>Rock &amp; Roll&nbsp;! It&#39;s l&#x2019;art &laquo;urbain&raquo; &eacute;t&eacute;</p>"
      expect(cleanHtml(html)).toEqual(["<p>Rock & Roll ! It's l’art «urbain» été</p>"])
   })

   it("keeps <h2> ids and normalizes other headings", () => {
      const html =
         '<h2 id="the-wall">The <strong>wall</strong></h2><h1>Main</h1><h3 id="sub">Sub title</h3><h4>Small</h4>'
      expect(cleanHtml(html)).toEqual([
         '<h2 id="the-wall">The wall</h2>',
         "<h2>Main</h2>",
         '<h3 id="sub">Sub title</h3>',
         "<h3>Small</h3>",
      ])
   })

   it("removes empty tags and whitespace-only paragraphs", () => {
      const html = '<p></p><p>   </p><h2 id="empty"></h2><p><br></p><p>Kept</p>'
      expect(cleanHtml(html)).toEqual(["<p>Kept</p>"])
   })

   it("converts <br> into line breaks and collapses whitespace", () => {
      const html = "<p>Line one<br>Line   two\n   continued<br/></p>"
      expect(cleanHtml(html)).toEqual(["<p>Line one\nLine two continued</p>"])
   })

   it("renders unordered and ordered lists as list items", () => {
      const html = "<ul><li>Spray</li><li><strong>Brush</strong></li></ul>" + "<ol><li>First</li><li>Second</li></ol>"
      expect(cleanHtml(html)).toEqual([
         "<li>Spray</li>",
         "<li>Brush</li>",
         '<li value="1">First</li>',
         '<li value="2">Second</li>',
      ])
   })

   it("handles paragraphs inside list items and blockquotes", () => {
      const html = "<ul><li><p>Item</p></li></ul><blockquote><p>Quote</p></blockquote><blockquote>Plain</blockquote>"
      expect(cleanHtml(html)).toEqual(["<p>Item</p>", "<p>Quote</p>", "<p>Plain</p>"])
   })

   it("removes iframes, scripts, comments and bookmark cards", () => {
      const html =
         "<!--kg-card-begin: html--><p>Before</p><!--kg-card-end: html-->" +
         '<figure class="kg-card kg-embed-card"><iframe src="https://www.youtube.com/embed/x" width="200"></iframe></figure>' +
         "<script>alert('x')</script>" +
         '<figure class="kg-card kg-bookmark-card"><a class="kg-bookmark-container" href="https://farmprod.be">' +
         '<div class="kg-bookmark-content"><div class="kg-bookmark-title">Farm Prod</div></div>' +
         '<div class="kg-bookmark-thumbnail"><img src="https://farmprod.be/thumb.jpg" alt=""></div></a></figure>' +
         "<p>After</p>"
      expect(cleanHtml(html)).toEqual(["<p>Before</p>", "<p>After</p>"])
   })

   it("keeps images wrapped in links and images inside paragraphs in order", () => {
      const html =
         `<figure class="kg-card kg-image-card"><a href="https://farmprod.be"><img src="${BASE}/a.jpg"></a></figure>` +
         `<p>Before <img src="${BASE}/b.jpg" alt=""> after</p>`
      expect(cleanHtml(html)).toEqual([
         `<img src="${BASE}/size/w600/a.jpg">`,
         "<p>Before</p>",
         `<img src="${BASE}/size/w600/b.jpg">`,
         "<p>after</p>",
      ])
   })

   it("extracts every image of a Ghost gallery card", () => {
      const html =
         '<figure class="kg-card kg-gallery-card kg-width-wide"><div class="kg-gallery-container"><div class="kg-gallery-row">' +
         `<div class="kg-gallery-image"><img src="${BASE}/2024/01/one.jpg" width="1200" height="800" loading="lazy" alt=""></div>` +
         `<div class="kg-gallery-image"><img src="${BASE}/2024/01/two.jpg" width="1200" height="800" loading="lazy" alt=""></div>` +
         "</div></div></figure>"
      expect(cleanHtml(html)).toEqual([
         `<img src="${BASE}/size/w600/2024/01/one.jpg">`,
         `<img src="${BASE}/size/w600/2024/01/two.jpg">`,
      ])
   })

   it("decodes &amp; in image URLs and ignores images without src", () => {
      const html = '<img src="https://cdn.example.com/pic.jpg?a=1&amp;b=2"><img alt="no src"><img src="">'
      expect(cleanHtml(html)).toEqual(['<img src="https://cdn.example.com/pic.jpg?a=1&b=2">'])
   })

   it("ignores text outside block tags", () => {
      expect(cleanHtml("<div>loose text</div><p>Kept</p>")).toEqual(["<p>Kept</p>"])
   })

   it("closes unclosed paragraphs", () => {
      expect(cleanHtml("<p>Unclosed")).toEqual(["<p>Unclosed</p>"])
   })
})

describe("image helpers", () => {
   const html = [
      "<p>Intro</p>",
      `<img src="${BASE}/size/w600/a.jpg">`,
      '<h2 id="x">Title</h2>',
      `<img src="${BASE}/size/w600/b.jpg">`,
   ]

   it("getImageSrc returns the src or null", () => {
      expect(getImageSrc(html[1])).toBe(`${BASE}/size/w600/a.jpg`)
      expect(getImageSrc("<p>No image</p>")).toBeNull()
      expect(getImageSrc(undefined)).toBeNull()
      expect(getImageSrc('<img srcset="a.jpg 600w">')).toBeNull()
   })

   it("getImageURI returns the w1600 variant", () => {
      expect(getImageURI(html[1])).toBe(`${BASE}/size/w1600/a.jpg`)
      expect(getImageURI("<p>No image</p>")).toBeNull()
   })

   it("getImages returns the large URIs of all images", () => {
      expect(getImages(html)).toEqual([`${BASE}/size/w1600/a.jpg`, `${BASE}/size/w1600/b.jpg`])
      expect(getImages(["<p>No image</p>"])).toEqual([])
      expect(getImages(undefined)).toEqual([])
   })

   it("works end to end with a full Ghost post", () => {
      const post =
         '<p>The <a href="https://farmprod.be">Farm Prod</a> crew painted a new wall.</p>' +
         imageCard("2023/05/wall.jpg", "Caption") +
         '<h2 id="details">Details</h2>' +
         imageCard("2023/05/detail.jpg")
      expect(getImages(cleanHtml(post))).toEqual([
         `${BASE}/size/w1600/2023/05/wall.jpg`,
         `${BASE}/size/w1600/2023/05/detail.jpg`,
      ])
   })
})

describe("tag helpers", () => {
   it("getTagName returns the lowercased tag name", () => {
      expect(getTagName("<p>Text</p>")).toBe("p")
      expect(getTagName('<h2 id="x">Title</h2>')).toBe("h2")
      expect(getTagName('<img src="a.jpg">')).toBe("img")
      expect(getTagName("plain text")).toBeNull()
   })

   it("getTagContent returns the inner text, including decoded special characters", () => {
      expect(getTagContent("<p>Text</p>")).toBe("Text")
      expect(getTagContent('<h2 id="x">Title</h2>')).toBe("Title")
      expect(getTagContent("<h2>No id</h2>")).toBe("No id")
      expect(getTagContent(cleanHtml("<p>a &lt;/p&gt; b</p>")[0])).toBe("a </p> b")
      expect(getTagContent('<img src="a.jpg">')).toBe("")
   })

   it("getTagAttribute reads attributes", () => {
      expect(getTagAttribute('<li value="3">Item</li>', "value")).toBe("3")
      expect(getTagAttribute("<li>Item</li>", "value")).toBeNull()
   })

   it("decodeEntities leaves unknown or invalid entities untouched", () => {
      expect(decodeEntities("&unknown; &#0; &amp;lt;")).toBe("&unknown; &#0; &lt;")
      expect(decodeEntities(undefined)).toBe("")
   })
})
