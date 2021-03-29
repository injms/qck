const i18next = require('i18next')
const Pseudo = require('i18next-pseudo')

const site = require('../_data/site')

// _t looks up the translation, and returns the string given as well as
// whether that is a fallback:
// * eg key present: _t('hello', 'fr') would give { text: 'Bonjour', fallback:
//   false }
// * eg key not present: _t('hello', 'de') would give { text: 'Hello', fallback:
//   true }
const translate = (key, locale = site.defaultLanguage) => {
  const i18n = i18next.createInstance()
  let pseudo = !!site.pseudoLocalisation

  if (key.startsWith('url:')) {
    pseudo = false
  }

  i18n
    .use(new Pseudo({
      languageToPseudo: 'en-gb',
      wrapped: true,
      enabled: pseudo,
    }))
    .init({
      ...site.i18n,
      lng: locale,
      postProcess: ['pseudo'],
    })

  const test = i18next.createInstance()
  test
    .use(new Pseudo({
      languageToPseudo: 'en-gb',
      wrapped: true,
      enabled: pseudo,
    }))
    .init({
      ...site.i18n,
      lng: locale,
      fallbackLng: false,
      postProcess: ['pseudo'],
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
