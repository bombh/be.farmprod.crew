// Get Youtube video ID
// const regex = /embed\/(.*?)\?/;
// const str = "<iframe src=\"https://www.youtube.com/embed/yIHzqZrwqmk?feature=oembed\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen=\"\" name=\"fitvid0\"></iframe>";
// const match = regex.exec(str);
// console.log(match[1]);

// Delete HTML tags
const deleteHtmlTag = (html, tag) => {
   return html.replace(new RegExp(`<${tag}>`, "gmi"), "").replace(new RegExp(`</${tag}>`, "gmi"), "")
}
// Delete HTML tags with attributes
const deleteHtmlTagAttributes = (html, tag) => {
   return html.replace(new RegExp(`<${tag}.+?>`, "gmi"), "").replace(new RegExp(`</${tag}>`, "gmi"), "")
}

// Delete HTML tags with content
const deleteHtmlTagFull = (html, tag) => {
   return html.replace(new RegExp(`<${tag}.+?>.+?</${tag}>`, "gmi"), "")
}

// Delete HTML attribute
const deleteHtmlAttribute = (html, attr) => {
   return html.replace(new RegExp(` ${attr}=".+?"`, "gmi"), "")
}

// Delete IMG tag
const deleteHtmlImg = (html) => {
   return html.replace('<img src="', "").replace('">', "").replace("/w600/", "/w1600/")
}

// Clean HTML
const cleanHtml = (html) => {
   html = deleteHtmlTagAttributes(html, "figure")
   html = deleteHtmlTagAttributes(html, "figcaption")
   html = deleteHtmlTagAttributes(html, "div")
   html = deleteHtmlTagAttributes(html, "iframe")
   html = deleteHtmlTagFull(html, "a")
   html = deleteHtmlTag(html, "strong")
   html = deleteHtmlTag(html, "br")
   html = html.replace(/ alt/gim, "")

   html = deleteHtmlAttribute(html, "class")
   html = deleteHtmlAttribute(html, "srcset")
   html = deleteHtmlAttribute(html, "loading")
   html = deleteHtmlAttribute(html, "width")
   html = deleteHtmlAttribute(html, "height")
   html = deleteHtmlAttribute(html, "sizes")

   // Replace image size
   html = html.replace(/images\//gim, "images/size/w600/")

   // delete any empty tags
   html = html.replace(/<(\w+)>\s*<\/\1>/gim, "")

   // Transfer string to array
   html = html.replace(/></gim, ">~<")
   html = html.split("~")

   return html
}

const getImages = (html) => {
   const images = []

   // Get images
   html.forEach((item) => {
      if (item.substring(0, 4) === "<img") {
         images.push(deleteHtmlImg(item))
      }
   })

   return images
}

const getImageURI = (tag) => {
   const regex = /src="(.+?)"/
   const match = regex.exec(tag)
   return match[1].replace("/w600/", "/w1600/")
}

export { cleanHtml, getImages, getImageURI }
