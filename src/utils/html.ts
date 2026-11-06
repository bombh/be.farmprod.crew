// HTML parsing / cleaning for Ghost CMS content.
//
// `cleanHtml` turns a Ghost HTML string into a flat array of simple tag strings consumed by RenderHtml:
//   "<p>Text</p>"                  paragraphs (and blockquotes), inline tags removed, entities decoded
//   "<h2 id=\"slug\">Title</h2>"   h1 / h2 headings (id kept when present)
//   "<h3 id=\"slug\">Title</h3>"   h3 to h6 headings
//   "<li>Item</li>"                unordered list items
//   "<li value=\"2\">Item</li>"    ordered list items (with their position)
//   "<img src=\"...\">"            images, resized to the w600 Ghost variant

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
const REMOVED_BLOCKS = [
   /<!--[\s\S]*?-->/g,
   /<(script|style|iframe|svg|figcaption|button|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,
   // Ghost bookmark cards (link previews with icon / thumbnail)
   /<figure\b[^>]*kg-bookmark-card[^>]*>[\s\S]*?<\/figure>/gi,
]

// Open block (paragraph, heading, list item...) while parsing
interface Block {
   tag: string
   attributes: string
   text: string
   value: number | null
}

// Open list (ul / ol) while parsing
interface List {
   ordered: boolean
   count: number
}

const BLOCK_TAGS = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote"]

// Tag or text token. Attributes may contain ">" inside quotes.
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
const resizeImage = (src: string) => src.replace(/\/content\/images\/(size\/w\d+\/)?/i, "/content/images/size/w600/")

// Collapse whitespace while keeping the line breaks coming from <br>
const normalizeText = (text: string) =>
   text
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim()

// Escape double quotes for attribute values in the output strings
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

   const closeBlock = (tag: string) => {
      const index = blocks.map((block) => block.tag).lastIndexOf(tag)
      if (index < 0) return
      while (blocks.length > index) {
         flush(blocks.pop()!)
      }
   }

   const currentBlock = () => blocks[blocks.length - 1]

   let match: RegExpExecArray | null
   TOKEN_REGEX.lastIndex = 0
   while ((match = TOKEN_REGEX.exec(source)) !== null) {
      const [, closing, rawName, attributes, text, lonelyBracket] = match

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

      // Any other tag (strong, em, a, span, div, figure...) is ignored but its text content is kept
   }

   // Unclosed blocks
   while (blocks.length) {
      flush(blocks.pop()!)
   }

   return output
}

// Get the tag name of a cleaned HTML item ("p", "h2", "img"...)
const getTagName = (item?: string | null): string | null => {
   const match = /^<([a-z][a-z0-9]*)/i.exec(item ?? "")
   return match ? match[1].toLowerCase() : null
}

// Get the text content of a cleaned HTML item ("<p>Text</p>" -> "Text")
const getTagContent = (item?: string | null): string => {
   const match = /^<([a-z][a-z0-9]*)\b[^>]*>([\s\S]*)<\/\1>$/i.exec(item ?? "")
   return match ? match[2] : ""
}

// Get an attribute of a cleaned HTML item (null if none)
const getTagAttribute = (item: string | null | undefined, name: string): string | null => {
   const match = /^<[a-z][a-z0-9]*\b([^>]*)>/i.exec(item ?? "")
   return match ? getAttribute(match[1], name) : null
}

// Get the src attribute of an <img> tag (null if none)
const getImageSrc = (tag?: string | null): string | null => {
   const match = /(?:^|\s)src="([^"]+)"/.exec(tag ?? "")
   return match ? match[1].replace(/&quot;/g, '"') : null
}

// Get the large (w1600) version of an <img> tag's src (null if none)
const getImageURI = (tag?: string | null): string | null => {
   const src = getImageSrc(tag)
   return src ? src.replace("/w600/", "/w1600/") : null
}

// Get the large image URIs from a cleaned HTML array
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

export { cleanHtml, decodeEntities, getImages, getImageSrc, getImageURI, getTagAttribute, getTagContent, getTagName }
