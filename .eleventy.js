const { extname } = require('path')
const { load: cheerio } = require('cheerio')
const { format: prettier } = require('prettier')
const {
  cssmin,
  debug,
  humandate,
  isodate,
  markdownify,
} = require('@injms/quack-nunjucks-filters')

// Allows a filter to not need the `safe` filter when returning HTML
const { runtime: { markSafe } } = require('nunjucks')

// Translation helper
const _t = require('./_helpers/t')

// Ensures URL and page key consistancy
const cleanKey = require('./_helpers/cleanKey')

// Get the collection for the page key, and an (optional) page parameter
const get = require('./_helpers/get')
const q = require('./_helpers/query')

// Settings and configurations
const site = require('./_data/site')

// Where the magic happens
const configuration = (eleventyConfig) => {
  // We want Eleventy to ignore the Sass files, but we don't want git to ignore
  // them - we need to tell Eleventy to ignore the `.gitignore` file (lol) and
  // _only_ use the `.eleventyignore` file.
  eleventyConfig.setUseGitIgnore(false)

  eleventyConfig.setLibrary('md', markdownify)

  eleventyConfig.addFilter('cssmin', (css) => cssmin(css))
  eleventyConfig.addFilter('debug', (thing) => debug(thing))
  eleventyConfig.addFilter('isodate', (datestring) => isodate(datestring))
  eleventyConfig.addFilter('markdownify', (markdown) =>
    markdownify.render(markdown),
  )
  eleventyConfig.addFilter('humandate', function (datestring, locale) {
    const setLocale = locale || this.ctx.language
    return humandate(datestring, setLocale)
  })

  eleventyConfig.addFilter('shuffle', function (collection) {
    const clonedCollection = _.cloneDeep(collection)

    for (let idx = clonedCollection.length - 1; idx > 0; idx--) {
      const jdx = Math.floor(Math.random() * (idx + 1))
      ;[clonedCollection[idx], clonedCollection[jdx]] = [clonedCollection[jdx], clonedCollection[idx]]
    }

    return clonedCollection
  })

  eleventyConfig.addFilter('exclude', function (collection, exclusions = []) {
    if (typeof exclusions === 'string') {
      exclusions = [exclusions]
    }

    return collection
      .filter(({ data: { alternativeKey } }) => !exclusions.includes(alternativeKey))
  })

  eleventyConfig.addFilter('limit_to', function (collection, limit = 3) {
    return collection.slice(0, limit)
  })

  eleventyConfig.addFilter('get', function (key, parameter, locale) {
    const { value, fallback } = get.bind(this)({ key, parameter, locale })

    return fallback === true
      ? value
      : markSafe(`<span lang="${site.defaultLanguage}">${value}</span>`)
  })

  eleventyConfig.addFilter('getkey', function (parameter, key, locale) {
    if (!parameter) return 'Error - no parameter set'

    const { value } = get.bind(this)({ key, parameter, locale })

    return value
  })

  // Returns the language of a page being linked to **only if** the page is a
  // different language to the current page; used for the `hreflang` atribute on
  // both the `link` and `a` elements.
  eleventyConfig.addFilter('hreflang',
  /**
  * @param  {string} key The key of the page being linked to.
  * @param  {string} [language] The language of the page being linked from.
  * @returns {string} [language] The language code of the page being linked to if
  * different to the page that the link is on.
  */
    function (key, language) {
      const thisLanguage = (language || this.ctx?.language) || site.defaultLanguage

      // Find all of the languages that the page is available in, and return an
      // array of those languages to be examined.
      const languagesThatThePageIsAvailableIn = q
        .bind(this.ctx.collections.all)({
          select: 'data.language',
          where: `data.alternativeKey = ${cleanKey(key)}`,
        })
        .map(({ data: { language } }) => language)

      // Check if there's a version of this page in the lanugage that we want.
      const existsInLocale = languagesThatThePageIsAvailableIn.includes(thisLanguage)

      // console.log(key, thisLanguage, existsInLocale)

      // We only need to return something if there **is not** a page available in
      // the language that we want - the `hreflang` attribute is only needed when
      // going from a page in one language to a page in a different language.
      if (!existsInLocale) return site.defaultLanguage
    },
  )

  // Links to a page in the current page's locale if available; if not, falls
  // back to linking to the default language.
  eleventyConfig.addFilter('link_to', function (text, url, language = site.defaultLanguage) {
    const thisLanguage = this.ctx.language || language
    const linkAttributes = []

    const pageFolder = this.ctx.page.inputPath
      .replace(this.ctx.page.filePathStem, '')
      .replace(extname(this.ctx.page.inputPath), '')

    let key = cleanKey(url)

    if (url.startsWith(pageFolder) === false) {
      key = pageFolder + url
    }

    // Find alternative for this key in another language; and return only the
    // things that we need to link to the alternative page.
    const alternatives = this.ctx.collections.all
      .filter(({ data }) => data.alternativeKey === key)
      .map(({ data: { page: { url }, language } }) => {
        return {
          url,
          language,
        }
      })

    // Check if there's a URL for the language we need the page in.
    const existsInLocale = alternatives
      .map(({ language }) => language)
      .includes(thisLanguage)

    const linkAvailableIn = existsInLocale ? thisLanguage : site.defaultLanguage

    alternatives.forEach((alternative) => {
      if (alternative.language === linkAvailableIn) {
        linkAttributes.push(`href="${alternative.url}"`)
      }
    })

    if (!existsInLocale) {
      linkAttributes.push(`hreflang="${site.defaultLanguage}"`)
    }

    // If the text is fallback text, it'll be wrapped in a span with a lang. To
    // minimise the number of unneeded elements we should move the lang
    // attribute to the link element - so instead of having a link wrapping a
    // span we have only a link element.
    const $ = cheerio(
      text.val || text, // If `text` has been marked safe, then text will be an object.
      null,
      false, // `false` parameter to stop this being wrapped in html and body tags.
    )

    if ($('span[lang]').length === 1) {
      const $span = $('span')
      const lang = $span.attr('lang')
      text = $span.text()

      linkAttributes.push(`lang="${lang}"`)
    }

    return markSafe(`<a ${linkAttributes.join(' ')}>${text}</a>`)
  })

  // Returns the translation for a specific key - like the `translate` or `t`
  // helper function in Ruby on Rails. Useful for `<title>` and similar.
  //
  // !! Don't use this filter for text that'll be used in markup as it doesn't
  // give you a fallback with the lang attribute. !!
  //
  // eg {{ 'photos' | i18nbare }}
  // eg {{ 'shopping_basket.pay' | i18nbare }}
  // Returns only the string if available; or the fallback string if not.
  eleventyConfig.addFilter('i18nbare', function (key, locale = site.defaultLanguage) {
    return _t(key, locale).text
  })

  // Returns the translation for a specific key with a fallback wrapped in a
  // span with the `lang` attibrute to help meet WCAG 2.1 SC 3.1.1.
  // https://www.w3.org/WAI/WCAG21/Understanding/language-of-page
  // Use:
  // eg {{ 'photos' | i18n }}
  // eg {{ 'shopping_basket.pay' | i18n }}
  eleventyConfig.addFilter('i18n', function (key, locale = site.defaultLanguage) {
    const thisPagesLanguage = this.ctx?.language || locale
    const translation = _t(key, thisPagesLanguage)

    if (translation.fallback) {
      return markSafe(`<span lang="${site.defaultLanguage}">${translation.text }</span>`)
    }
    return translation.text
  })

  // Prettifys HTML
  eleventyConfig.addTransform('html', (content, outputPath) => {
    if (outputPath.endsWith('.html')) {
      return prettier(content, {
        parser: 'html',
      })
    }
    return content
  })

  return {
    dir: {
      data: '../_data',
      input: '_pages',
      includes: '../_includes',
      layouts: '../_layouts',
      output: 'site',
    },
  }
}

module.exports = configuration
