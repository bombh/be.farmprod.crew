/**
 * html.ts
 *
 * HTML parsing / cleaning for Ghost CMS content, with no dependency (regex tokenizer, no DOM, works the same on
 * iOS, Android and web).
 *
 * `cleanHtml` turns a Ghost HTML string into a flat array of simple tag strings consumed by RenderHtml
 * (components/app/RenderHtml.tsx), which maps each string to a React Native element:
 *   "<p>Text</p>"                  paragraphs (and blockquotes), inline tags removed, entities decoded
 *   "<h2 id=\"slug\">Title</h2>"   h1 / h2 headings (id kept when present)
 *   "<h3 id=\"slug\">Title</h3>"   h3 to h6 headings
 *   "<li>Item</li>"                unordered list items
 *   "<li value=\"2\">Item</li>"    ordered list items (with their position)
 *   "<img src=\"...\">"            images, resized to the w600 Ghost variant
 *
 * How `cleanHtml` works, step by step:
 * 1. Removes whole blocks that are never displayed (comments, script/style/iframe/svg/figcaption/button, Ghost
 *    bookmark cards).
 * 2. Walks the source with TOKEN_REGEX (tag or text tokens). Text is appended to the innermost open block
 *    (p, h1-h6, li, blockquote); <br> adds a line break; <img> flushes the open block (to keep reading order) and
 *    outputs an <img>; <ul>/<ol> push/pop a list so <li> know their position; any other tag (strong, em, a, span,
 *    div, figure...) is ignored but its text is kept.
 * 3. `flush` normalizes the text of a block and emits the matching simple tag; empty blocks are dropped.
 * The other exports read that cleaned format back: tag name / content / attribute, and the image helpers used by the
 * galleries (`getImages` returns the large w1600 URIs, see screens/Gallery.tsx and the pictures routes).
 *
 * Used by: components/app/RenderHtml.tsx, screens/WorkDetail.tsx, app/(drawer)/about and 20years screens.
 * Unit tested in utils/__tests__/html.test.ts.
 */

// Named entities commonly found in Ghost content (French content included)
const NAMED_ENTITIES: Record<string, string> = {
   amp: "&",
   lt: "<",
   gt: ">",
   quot: '"',
   apos: "'",
   nbsp: " ",
   rsquo: "’",
   lsquo: "‘",
   rdquo: "”",
   ldquo: "“",
   laquo: "«",
   raquo: "»",
   hellip: "…",
   ndash: "–",
   mdash: "—",
   middot: "·",
   bull: "•",
   copy: "©",
   reg: "®",
   trade: "™",
   deg: "°",
   euro: "€",
   times: "×",
   agrave: "à",
   acirc: "â",
   ccedil: "ç",
   eacute: "é",
   egrave: "è",
   ecirc: "ê",
   euml: "ë",
   icirc: "î",
   iuml: "ï",
   ocirc: "ô",
   ugrave: "ù",
   ucirc: "û",
   uuml: "ü",
   oelig: "œ",
   Agrave: "À",
   Ccedil: "Ç",
   Eacute: "É",
   Egrave: "È",
   Ecirc: "Ê",
}

// Decode HTML entities (named, decimal and hexadecimal) in a single pass
// Returns the text with entities replaced; unknown or invalid ones are left as they are; null-safe
const decodeEntities = (text?: string | null): string => {
   if (!text) return ""

   return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity: string, code: string) => {
      if (code[0] === "#") {
         const isHex = code[1] === "x" || code[1] === "X"
         const value = parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10)
         if (Number.isNaN(value) || value <= 0 || value > 0x10ffff) return entity
         return String.fromCodePoint(value)
      }
      return NAMED_ENTITIES[code] ?? entity
   })
}

// Blocks whose whole content is not rendered in the app
// Each regex is applied with replace(..., "") before tokenizing
const REMOVED_BLOCKS = [
   /<!--[\s\S]*?-->/g,
   /<(script|style|iframe|svg|figcaption|button|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,
   // Ghost bookmark cards (link previews with icon / thumbnail)
   /<figure\b[^>]*kg-bookmark-card[^>]*>[\s\S]*?<\/figure>/gi,
]

// Open block (paragraph, heading, list item...) while parsing
interface Block {
   // Lowercased tag name (p, h1-h6, li, blockquote)
   tag: string
   // Raw attribute string of the opening tag (to read the id of headings)
   attributes: string
   // Text accumulated so far
   text: string
   // Position in an ordered list (li of an <ol> only), else null
   value: number | null
}

// Open list (ul / ol) while parsing
interface List {
   // <ol> (true) or <ul> (false)
   ordered: boolean
   // Number of <li> seen so far (gives the value of ordered items)
   count: number
}

// Tags that open a text block; everything else is transparent
const BLOCK_TAGS = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote"]

// Tag or text token. Attributes may contain ">" inside quotes.
// Groups: 1 = "/" if closing, 2 = tag name, 3 = raw attributes, 4 = text, 5 = a lonely "<"
const TOKEN_REGEX = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|([^<]+)|(<)/g

// Read an attribute value from a raw attribute string
const getAttribute = (attributes: string | null | undefined, name: string): string | null => {
   const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>/]+))`, "i").exec(
      attributes ?? "",
   )
   if (!match) return null
   return match[1] ?? match[2] ?? match[3] ?? null
}

// Use the w600 Ghost variant for content images
// Rewrites a Ghost image URL to its w600 size variant (replaces any existing /size/wNNN/ segment)
const resizeImage = (src: string) => src.replace(/\/content\/images\/(size\/w\d+\/)?/i, "/content/images/size/w600/")

// Collapse whitespace while keeping the line breaks coming from <br>
// Trims each line, so spaces around <br> line breaks disappear
const normalizeText = (text: string) =>
   text
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim()

// Escape double quotes for attribute values in the output strings
// Output strings use double quotes, so quotes inside values are escaped
const escapeAttribute = (value: string) => value.replace(/"/g, "&quot;")

// Clean HTML: Ghost HTML string -> array of simple tag strings (anything else gives an empty array)
const cleanHtml = (html: unknown): string[] => {
   if (!html || typeof html !== "string") return []

   let source = html
   REMOVED_BLOCKS.forEach((regex) => {
      source = source.replace(regex, "")
   })

   const output: string[] = []
   const blocks: Block[] = [] // stack of open blocks: { tag, attributes, text, value }
   const lists: List[] = [] // stack of open lists: { ordered, count }

   // Emits the simple tag of a finished block (h1/h2 -> h2, h3-h6 -> h3, li, else p) and empties its text;
   // skips empty text
   const flush = (block: Block) => {
      const text = normalizeText(block.text)
      block.text = ""
      if (!text) return

      switch (block.tag) {
         case "h1":
         case "h2":
         case "h3":
         case "h4":
         case "h5":
         case "h6": {
            const level = block.tag === "h1" || block.tag === "h2" ? "h2" : "h3"
            const id = getAttribute(block.attributes, "id")
            const idAttribute = id ? ` id="${escapeAttribute(id)}"` : ""
            output.push(`<${level}${idAttribute}>${text}</${level}>`)
            break
         }
         case "li": {
            const valueAttribute = block.value ? ` value="${block.value}"` : ""
            output.push(`<li${valueAttribute}>${text}</li>`)
            break
         }
         default:
            output.push(`<p>${text}</p>`)
      }
   }

   // Closes the most recent open block of that tag (and any block opened inside it) by flushing them
   const closeBlock = (tag: string) => {
      const index = blocks.map((block) => block.tag).lastIndexOf(tag)
      if (index < 0) return
      while (blocks.length > index) {
         flush(blocks.pop()!)
      }
   }

   // Innermost open block, undefined when outside any block
   const currentBlock = () => blocks[blocks.length - 1]

   let match: RegExpExecArray | null
   TOKEN_REGEX.lastIndex = 0
   while ((match = TOKEN_REGEX.exec(source)) !== null) {
      const [, closing, rawName, attributes, text, lonelyBracket] = match

      // Text token: appended to the open block, or dropped when outside any block
      // Text
      if (text !== undefined || lonelyBracket !== undefined) {
         const block = currentBlock()
         if (block) block.text += decodeEntities((text ?? lonelyBracket).replace(/\s+/g, " "))
         continue
      }

      const name = rawName.toLowerCase()

      if (name === "br") {
         const block = currentBlock()
         if (block) block.text += "\n"
         continue
      }

      if (name === "img") {
         const src = decodeEntities(getAttribute(attributes, "src") ?? "").trim()
         if (!src) continue
         // The open block is flushed first so the image comes after the text written before it
         // Keep text order: flush the text before the image
         const block = currentBlock()
         if (block) flush(block)
         output.push(`<img src="${escapeAttribute(resizeImage(src))}">`)
         continue
      }

      if (name === "ul" || name === "ol") {
         if (closing) {
            closeBlock("li")
            lists.pop()
         } else {
            const block = currentBlock()
            if (block) flush(block)
            lists.push({ ordered: name === "ol", count: 0 })
         }
         continue
      }

      if (BLOCK_TAGS.includes(name)) {
         if (closing) {
            closeBlock(name)
            continue
         }

         // A new <li> closes the previous unclosed one of the same list
         if (name === "li" && currentBlock()?.tag === "li") closeBlock("li")

         const parent = currentBlock()
         if (parent) flush(parent)

         let value: number | null = null
         if (name === "li") {
            const list = lists[lists.length - 1]
            if (list) {
               list.count += 1
               if (list.ordered) value = list.count
            }
         }
         blocks.push({ tag: name, attributes, text: "", value })
      }

      // Not a block tag: see comment below
      // Any other tag (strong, em, a, span, div, figure...) is ignored but its text content is kept
   }

   // Flush what is still open at the end of the source (malformed HTML)
   // Unclosed blocks
   while (blocks.length) {
      flush(blocks.pop()!)
   }

   return output
}

// Get the tag name of a cleaned HTML item ("p", "h2", "img"...)
// Returns the lowercased tag name
const getTagName = (item?: string | null): string | null => {
   const match = /^<([a-z][a-z0-9]*)/i.exec(item ?? "")
   return match ? match[1].toLowerCase() : null
}

// Get the text content of a cleaned HTML item ("<p>Text</p>" -> "Text")
// Returns the inner HTML of a cleaned item (still with entities decoded and no nested tags)
const getTagContent = (item?: string | null): string => {
   const match = /^<([a-z][a-z0-9]*)\b[^>]*>([\s\S]*)<\/\1>$/i.exec(item ?? "")
   return match ? match[2] : ""
}

// Get an attribute of a cleaned HTML item (null if none)
// Returns an attribute value of the opening tag of a cleaned item
const getTagAttribute = (item: string | null | undefined, name: string): string | null => {
   const match = /^<[a-z][a-z0-9]*\b([^>]*)>/i.exec(item ?? "")
   return match ? getAttribute(match[1], name) : null
}

// Get the src attribute of an <img> tag (null if none)
// Reads src from our own output format (double quotes only) and restores &quot;
const getImageSrc = (tag?: string | null): string | null => {
   const match = /(?:^|\s)src="([^"]+)"/.exec(tag ?? "")
   return match ? match[1].replace(/&quot;/g, '"') : null
}

// Get the large (w1600) version of an <img> tag's src (null if none)
// Used for the zoomable gallery: the list shows w600, the viewer wants w1600
const getImageURI = (tag?: string | null): string | null => {
   const src = getImageSrc(tag)
   return src ? src.replace("/w600/", "/w1600/") : null
}

// Get the large image URIs from a cleaned HTML array
// Returns the w1600 URI of each <img> item of a cleaned array, in order; [] for invalid input
const getImages = (html?: string[] | null): string[] => {
   if (!Array.isArray(html)) return []

   const images: string[] = []

   html.forEach((item) => {
      if (typeof item === "string" && item.startsWith("<img")) {
         const uri = getImageURI(item)
         if (uri) images.push(uri)
      }
   })

   return images
}

// Public API of the module
export { cleanHtml, decodeEntities, getImages, getImageSrc, getImageURI, getTagAttribute, getTagContent, getTagName }
