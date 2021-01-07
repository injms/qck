const i18next = require('i18next')

const site = require('../_data/site')

// _t looks up the translation, and returns the string given as well as
// whether that is a fallback:
// * eg key present: _t('hello', 'fr') would give { text: 'Bonjour', fallback:
//   false }
// * eg key not present: _t('hello', 'de') would give { text: 'Hello', fallback:
//   true }
const translate = (key, locale) => {
  const i18n = i18next.createInstance()
  i18n.init({
    ...site.i18n,
    lng: locale,
  })

  const test = i18next.createInstance()
  test.init({
    ...site.i18n,
    lng: locale,
    fallbackLng: false,
  })

  // To allow for namespaces, we need to see if they key (eg 'photos', or
  // 'project:orion') ends with the default, non-namespaced key (eg 'photos, or
  // 'orion'.)
  const keyExistsInCurrentLocale = key.endsWith(test.t(key))

  return {
    text: i18n.t(key),
    fallback: keyExistsInCurrentLocale,
  }
}

module.exports = translate
