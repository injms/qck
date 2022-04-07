const {
  extname,
  basename,
} = require('path')

const { load: cheerio } = require('cheerio')
const {
  cssmin,
  debug,
  humandate,
  isodate,
} = require('@injms/quack-nunjucks-filters')
const markdownify = require('./_filters/markdownify')

const shuffle = require('./_filters/collection/shuffle')
const exclude = require('./_filters/collection/exclude')
const limitTo = require('./_filters/collection/limit-to')

const Image = require('@11ty/eleventy-img')

// Allows a filter to not need the `safe` filter when returning HTML
const { runtime: { markSafe } } = require('nunjucks')

// Translation helper
const _t = require('./_helpers/t')

// Ensures URL and page key consistancy
const cleanKey = require('./_helpers/cleanKey')

// Get the collection for the page key, and an (optional) page parameter
const get = require('./_helpers/get')
const q = require('./_helpers/query')

// Add an attribute to a DOM element.
const addAttribute = require('./_helpers/addAttribute')

// Given a width and a height, returns a name for the aspect ratio
const aspectRatio = require('./_helpers/calculateAspectRatio')

// Settings and configurations
const site = require('./_data/site')

// Where the magic happens
const configuration = (eleventyConfig) => {
  // We want Eleventy to ignore the Sass files, but we don't want git to ignore
  // them - we need to tell Eleventy to ignore the `.gitignore` file (lol) and
  // _only_ use the `.eleventyignore` file.
  eleventyConfig.setUseGitIgnore(false)

  eleventyConfig.setLibrary('md', markdownify)

  // eleventyConfig.addPassthroughCopy({ '_pages/**/*.jpg': 'assets/images/' })
  eleventyConfig.addPassthroughCopy({ '_assets/': 'assets/' })
  eleventyConfig.addPassthroughCopy({ '_includes/**/*.css': 'assets/stylesheets/' })

  eleventyConfig.addFilter('cssmin', (css) => cssmin(css))
  eleventyConfig.addFilter('debug', (thing) => debug(thing))
  eleventyConfig.addFilter('isodate', (datestring) => isodate(datestring))
  eleventyConfig.addFilter('markdownify', (markdown) => markdownify.render(markdown))
  eleventyConfig.addFilter('humandate', function (datestring, locale) {
    const setLocale = locale || this.ctx.language
    return humandate(datestring, setLocale)
  })

  eleventyConfig.addFilter('shuffle', (collection) => shuffle(collection))
  eleventyConfig.addFilter('exclude', (collection, exclusions = []) => exclude(collection, exclusions))
  eleventyConfig.addFilter('limit_to', (collection, limit = 3) => limitTo(collection, limit))

  // eg page.alternativeKey | get('title', 'en-gb')
  eleventyConfig.addFilter('get', function (key, parameter, locale) {
    const { value, fallback } = get.bind(this)({ key, parameter, locale })

    return fallback === true
      ? value
      : markSafe(`<span lang="${site.defaultLanguage}">${value}</span>`)
  })

  // eg 'page' | getkey(alternativeKey, 'es')
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

  // Returns only the URI to the page - useful for things in the head.
  eleventyConfig.addFilter('href_to',
    function (key, language) {
      const thisLanguage = (language || this.ctx?.language) || site.defaultLanguage

      // Find alternative for this key in another language; and return only the
      // things that we need to link to the alternative page.
      const alternatives = q.bind(this.ctx.collections.all)({
        select: [
          'data.page.url',
          'data.language',
        ],
        where: [
          `data.alternativeKey = ${cleanKey(key)}`,
        ],
      })
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

      const r = alternatives
        .filter((alternative) => alternative.language === linkAvailableIn)
        .map(({ url }) => url)

      // console.log(r, thisLanguage)
      return r
    })

  eleventyConfig.addFilter('projectfilter', function (collection, filter) {
    if (!filter) return collection

    return q.bind(collection)({ where: `data.projectKey = ${filter}` })
  })

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

  // Returns the translation for a specific key with a fallback wrapped in a
  // span with the `lang` attibrute to help meet WCAG 2.1 SC 3.1.1.
  // https://www.w3.org/WAI/WCAG21/Understanding/language-of-page
  // Use:
  // eg {{ 'photos' | i18n }}
  // eg {{ 'shopping_basket.pay' | i18n }}
  eleventyConfig.addFilter('i18n', function (key, locale) {
    const thisPagesLanguage = (locale || this.ctx?.language) || site.defaultLanguage
    const { fallback, text } = _t(key, thisPagesLanguage)

    if (fallback) {
      return markSafe(
        `<span lang="${site.defaultLanguage}">${text}</span>`,
      )
    } else {
      return text
    }
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

  //
  eleventyConfig.addFilter('i18nurl', function (key, locale = site.defaultLanguage) {
    return _t(`url:${key}`, locale).text
  })

  eleventyConfig.addFilter('add_class', function (element, className) {
    return addAttribute({ element, attribute: 'class', content: className })
  })
  eleventyConfig.addFilter('addRel', function (element, rel) {
    return addAttribute({ element, attribute: 'rel', content: rel })
  })
  eleventyConfig.addFilter('addId', function (element, id) {
    return addAttribute({ element, attribute: 'id', content: id })
  })

  eleventyConfig.addCollection('photos', function (collection) {
    const photos = q.bind(collection.getAll())({
      where: [
        'data.type = photo',
        `data.language = ${site.defaultLanguage}`,
      ],
      orderBy: 'data.title ASC',
    })

    return photos
  })

  // This isn't strictly speaking a proper collection - it's an array of the
  // different projects for use on the gallery page.
  eleventyConfig.addCollection('projects', function (collection) {
    const projectKeys = q.bind(collection.getAll())({
      select: 'data.projectKey',
      where: `data.language = ${site.defaultLanguage}`,
    })
      .map(({ data }) => data?.projectKey) // Just the key please.
      .filter((item) => !!item) // Remove any undefineds
      .filter((item, position, array) => array.indexOf(item) === position) // Dedupe
      .map((projectKey) => {
        return {
          key: projectKey,
          nameKey: `project:${projectKey}`,
          slug: projectKey.replace('_', '-'),
        }
      })

    return projectKeys
  })

  eleventyConfig.addNunjucksAsyncShortcode('image', async function (
    filename,
    alt = '',
    sizes = '100w',
    outputFormat = ['jpeg'],
  ) {
    const resizeTo = () => {
      if (site.production === false) {
        return [480, 1080]
      }

      const minimum = 240
      const maximum = 1080
      const interval = 40

      const sizes = [minimum]

      while (sizes[sizes.length - 1] < maximum) {
        if (sizes[sizes.length - 1] + interval < maximum) {
          sizes.push(sizes[sizes.length - 1] + interval)
        } else {
          sizes.push(maximum)
        }
      }

      return sizes
    }

    const imageMetadata = await Image(filename, {
      widths: resizeTo(),
      formats: [outputFormat].flat(),
      urlPath: '/assets/images/',
      outputDir: './site/assets/images/',
      filenameFormat: function (id, src, width, format, options) {
        const name = basename(src, extname(src))
        // id: hash of the original image
        // src: original image path
        // width: current width in px
        // format: current file format
        // options: set of options passed to the Image call
        return `${name}-${width}w-${id}.${format}`
      },
    })

    const imageSrc = imageMetadata[outputFormat[0]][0]

    const imageAttributes = {
      alt,
      class: `responsive-image responsive-image--${aspectRatio({
        width: imageSrc.width,
        height: imageSrc.height,
      })}`,
      decoding: 'async',
      loading: 'lazy',
      sizes,
    }

    return Image.generateHTML(imageMetadata, imageAttributes)
  })

  return {
    dir: {
      data: '../_data',
      input: process.env.ELEVENTY_PLACEHOLDER === 'true' ? '_pages-placeholder' : '_pages',
      includes: '../_includes',
      layouts: '../_layouts',
      output: 'site',
    },
  }
}

module.exports = configuration
