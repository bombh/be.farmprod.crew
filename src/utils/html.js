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
const NAMED_ENTITIES = {
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
const decodeEntities = (text) => {
   if (!text) return ""

   return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
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

const BLOCK_TAGS = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote"]

// Tag or text token. Attributes may contain ">" inside quotes.
const TOKEN_REGEX = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|([^<]+)|(<)/g

// Read an attribute value from a raw attribute string
const getAttribute = (attributes, name) => {
   const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>/]+))`, "i").exec(
      attributes ?? "",
   )
   if (!match) return null
   return match[1] ?? match[2] ?? match[3] ?? null
}

// Use the w600 Ghost variant for content images
const resizeImage = (src) => src.replace(/\/content\/images\/(size\/w\d+\/)?/i, "/content/images/size/w600/")

// Collapse whitespace while keeping the line breaks coming from <br>
const normalizeText = (text) =>
   text
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim()

// Escape double quotes for attribute values in the output strings
const escapeAttribute = (value) => value.replace(/"/g, "&quot;")

// Clean HTML: Ghost HTML string -> array of simple tag strings
const cleanHtml = (html) => {
   if (!html || typeof html !== "string") return []

   let source = html
   REMOVED_BLOCKS.forEach((regex) => {
      source = source.replace(regex, "")
   })

   const output = []
   const blocks = [] // stack of open blocks: { tag, attributes, text, value }
   const lists = [] // stack of open lists: { ordered, count }

   const flush = (block) => {
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

   const closeBlock = (tag) => {
      const index = blocks.map((block) => block.tag).lastIndexOf(tag)
      if (index < 0) return
      while (blocks.length > index) {
         flush(blocks.pop())
      }
   }

   const currentBlock = () => blocks[blocks.length - 1]

   let match
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

         let value = null
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
      flush(blocks.pop())
   }

   return output
}

// Get the tag name of a cleaned HTML item ("p", "h2", "img"...)
const getTagName = (item) => {
   const match = /^<([a-z][a-z0-9]*)/i.exec(item ?? "")
   return match ? match[1].toLowerCase() : null
}

// Get the text content of a cleaned HTML item ("<p>Text</p>" -> "Text")
const getTagContent = (item) => {
   const match = /^<([a-z][a-z0-9]*)\b[^>]*>([\s\S]*)<\/\1>$/i.exec(item ?? "")
   return match ? match[2] : ""
}

// Get an attribute of a cleaned HTML item (null if none)
const getTagAttribute = (item, name) => {
   const match = /^<[a-z][a-z0-9]*\b([^>]*)>/i.exec(item ?? "")
   return match ? getAttribute(match[1], name) : null
}

// Get the src attribute of an <img> tag (null if none)
const getImageSrc = (tag) => {
   const match = /(?:^|\s)src="([^"]+)"/.exec(tag ?? "")
   return match ? match[1].replace(/&quot;/g, '"') : null
}

// Get the large (w1600) version of an <img> tag's src (null if none)
const getImageURI = (tag) => {
   const src = getImageSrc(tag)
   return src ? src.replace("/w600/", "/w1600/") : null
}

// Get the large image URIs from a cleaned HTML array
const getImages = (html) => {
   if (!Array.isArray(html)) return []

   const images = []

   html.forEach((item) => {
      if (typeof item === "string" && item.startsWith("<img")) {
         const uri = getImageURI(item)
         if (uri) images.push(uri)
      }
   })

   return images
}

export { cleanHtml, decodeEntities, getImages, getImageSrc, getImageURI, getTagAttribute, getTagContent, getTagName }
