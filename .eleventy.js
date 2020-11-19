const {
  cssmin,
  debug,
  humandate,
  isodate,
  markdownify,
} = require('@injms/quack-nunjucks-filters')

const { format: prettier } = require('prettier')

const isProduction = process.env.NODE_ENV === 'production'

const configuration = (eleventyConfig) => {
  // We want Eleventy to ignore the Sass files, but we don't want git to ignore
  // them - we need to tell Eleventy to ignore the `.gitignore` file (lol) and
  // _only_ use the `.eleventyignore` file.
  eleventyConfig.setUseGitIgnore(false)

  eleventyConfig.setBrowserSyncConfig({
    ui: false,
  })

  eleventyConfig.addPassthroughCopy({ 'compiled-assets': '/' })

  eleventyConfig.setLibrary('md', markdownify)

  eleventyConfig.addFilter('cssmin', (css) => cssmin(css))
  eleventyConfig.addFilter('debug', (thing) => debug(thing))
  eleventyConfig.addFilter('humandate', (datestring, locale) =>
    humandate(datestring, locale)
  )
  eleventyConfig.addFilter('isodate', (datestring) => isodate(datestring))
  eleventyConfig.addFilter('markdownify', (markdown) =>
    markdownify.render(markdown)
  )

  // Prettifys HTML
  eleventyConfig.addTransform('html', (content, outputPath) => {
    if (outputPath.endsWith('.html')) {
      if (isProduction === true) {
        return htmlMinifier(content, {
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          sortAttributes: true,
          sortClassName: true,
        })
      }

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
