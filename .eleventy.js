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

const _t = require('./_helpers/t')

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
