const i18next = require('i18next')

const site = require('./site')

module.exports = {
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
  direction: function ({ language }) {
    if (typeof language === 'string') {
      const i18n = i18next.createInstance()
      i18n.init()
      return i18n.dir(language)
    }

    return 'ltr'
  },
}
