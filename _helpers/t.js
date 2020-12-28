const i18next = require('i18next')

const site = require('../_data/site')

// _t looks up the translation, and returns the string given as well as
// whether that is a fallback:
// eg _t('hello', 'fr') would give { text: 'Bonjour', fallback: false }
// eg _t('hello', 'de') would give { text: 'Hello', fallback: true }
const translate = (key, locale) => {
  const config = Object.assign(site.i18n, { lng: locale })

  const i18n = i18next.createInstance()
  i18n.init(config)

  let keyExistsInCurrentLocale

  if (site.defaultLanguage === locale) {
    keyExistsInCurrentLocale = !i18n.exists(key)

    if (!i18n.exists(key)) {
      console.warn(`\n ! Key "${key}" has no translation at all.\n`)
    }
  } else {
    keyExistsInCurrentLocale = i18n.t(key) === i18n.t(key, { lng: site.defaultLanguage })
  }

  return {
    text: i18n.t(key),
    fallback: keyExistsInCurrentLocale,
  }
}

module.exports = translate
