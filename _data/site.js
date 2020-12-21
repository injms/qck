const getTranslations = require('../_helpers/getTranslations')

// All the default data and settings. Default strings go into the i18n files.
const site = {
  defaultLanguage: 'en-gb',
}

site.i18n = {
  debug: false,
  fallbackLng: site.defaultLanguage,
  lowerCaseLng: true,
  resources: getTranslations('_locales'),
}

module.exports = site
