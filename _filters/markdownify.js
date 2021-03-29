const MarkdownIt = require('markdown-it')
const cleanKey = require('../_helpers/cleanKey')
const q = require('../_helpers/query')

const {
  extname,
} = require('path')

const md = new MarkdownIt({
  html: true,

  // Enable some language-neutral replacement and quotes beautification.
  typographer: true,

  // Don't automatically link a thing that looks like URL.
  linkify: false,
})

const markdownLinkI18n = function (md) {
  const defaultRender = md.renderer.rules.link_open || this.defaultRender

  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    tokens.forEach((token) => {
      if (token.type === 'link_open') {
        // The attributes are an array of arrays; so
        // <a href="https://example.com" id="example-link"> would be
        // [['href', 'https://example.com], ['id', 'example-link']].
        // This destructes the href contents only for use in constructing the
        // key.
        let hrefPosition
        let [[, key]] = token.attrs.filter(([attribute], i) => {
          if (attribute === 'href') {
            hrefPosition = i
            return true
          }
          return false
        })

        if (key === '/') key = '/homepage/'

        key = cleanKey(key)

        const pageFolder = env.page.inputPath
          .replace(env.page.filePathStem, '')
          .replace(extname(env.page.inputPath), '')

        if (key.startsWith(pageFolder) === false) {
          key = pageFolder + key
        }

        const [thisLang] = q.bind(env.collections.all)({
          select: [
            'data.page.url',
            'data.language',
          ],
          where: [
            `data.alternativeKey = ${key}`,
            `data.language = ${env.language}`,
          ],
        })

        const languageOfPageBeingLinkeTo = thisLang ? thisLang.data.language : env.site.defaultLanguage

        // Update the href attribute's contents:
        token.attrs[hrefPosition][1] = `/${languageOfPageBeingLinkeTo}${token.attrs[hrefPosition][1]}`

        // Only add the `hreflang` attribute when it's needed:
        if (env.language !== languageOfPageBeingLinkeTo) {
          token.attrs.push(['hreflang', languageOfPageBeingLinkeTo])
        }
      }
    })

    return defaultRender(tokens, idx, options, env, self)
  }
}

markdownLinkI18n.defaultRender = function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}

md.use(markdownLinkI18n)

module.exports = md
