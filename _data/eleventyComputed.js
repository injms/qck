const i18next = require('i18next')
const { dirname, extname, join } = require('path')

const cleanKey = require('../_helpers/cleanKey')

const site = require('./site')

module.exports = {
  layout: function ({ layout }) {
    return layout || 'default'
  },
  language: function ({ language }) {
    return language.toLowerCase() || site.defaultLanguage
  },
  permalink: function ({
    permalink,
    language, // language is required for slug interpolation
  }) {
    return permalink || '/{{ language }}/{{ title | slug }}/'
  },

  // ---------------------------------------------------------------------------
  // direction - string: either 'rtl' or 'ltr'
  // ---------------------------------------------------------------------------
  // Returns the text direction for the page's language.
  direction: function ({ direction, language }) {
    if (typeof language !== 'string') {
      throw new Error('`language` should be a string.')
    }

    if (direction) {
      return direction
    }

      const i18n = i18next.createInstance()
      i18n.init()

      return i18n.dir(language)
  },

  // ---------------------------------------------------------------------------
  // alternativeKey - string
  // ---------------------------------------------------------------------------
  // Each page needs a unique key so that any translations can be linked from
  // one language to the others. For example, a page in English, Spanish, and
  // French would have different files but have the same key.
  // The key can be manually set if rqeuired - this will take precedence over
  // the automatically generated key.
  //
  // Assumes a folder-per-page set up - not a file-per-page set up; for example:
  //  → about/
  //    ↳ about.md
  //    ↳ about.es.md
  //    ↳ about.pt-br.md
  //  → homepage/
  //    ↳ homepage.md
  alternativeKey: function ({ alternativeKey, page }) {
    if (alternativeKey) {
      return alternativeKey
    }

    const cleanedKey = cleanKey(dirname(page.inputPath))

    return cleanedKey
  },
  pageID: function ({ pageID, page: { inputPath } }) {
    if (pageID) {
      return pageID
    }

    return inputPath
  },

  // ---------------------------------------------------------------------------
  // alternatives - array of objects
  // ---------------------------------------------------------------------------
  // A list of the page's translations is needed to create `rel="alternate"`
  // metadata, link between the translations, and provide translations in the
  // site's RSS feed.
  alternatives: function ({ collections, alternativeKey, language }) {
    const i18n = i18next.createInstance()
    i18n.init(site.i18n)

    const alternativeLanguages = collections.all
      .filter(({ data }) => data.alternativeKey === alternativeKey) // only this key
      .filter(({ data }) => data.language !== language) // not this page's language please
      .map(({ data }) => {
        const language = data.language.toLowerCase()

        return {
          language,
          languageName: i18n.t('locale', { lng: language }),
          url: data.page.url,
          pageTitle: data.title,
        }
      })

    return alternativeLanguages
  },
}
