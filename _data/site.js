const getTranslations = require('../_helpers/getTranslations')
const { join } = require('path')

// All the default data and settings. Default strings go into the i18n files.
const site = {
  commitRef: process.env.COMMIT_REF,
  defaultLanguage: 'en-gb',
  production: process.env.CONTEXT === 'production',
  pseudoLocalisation: process.env.PSEUDOL10N === 'true',
  baseURL: (function () {
    if (process.env.CONTEXT === 'production') return process.env.URL
    if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL
    return 'http://localhost:8080'
  })(),
  themeColour: '#f0f0f0',
  rel: {
    me: [
      'https://www.ianjamesphotograpy.com',
      'https://ianjames.photograpy',
      'https://inj.ms',
      'https://instagram.com/inj.ms',
      'https://github.com/injms',
      'https://twitter.com/_injms_',
    ],
    publisher: [
      'https://inj.ms',
    ],
  },
  twitter: {
    creator: '@_injms_',
    site: '@_injms_',
  },
  opengraph: {
    type: 'website',
  },
}

const localisationFolder = join(
  process.env.ELEVENTY_PLACEHOLDER === 'true' ? '_pages-placeholder' : '_pages',
  '_locales',
)

site.i18n = {
  debug: false,
  fallbackLng: site.defaultLanguage,
  lowerCaseLng: true,
  ns: ['common', 'url', 'project'],
  defaultNS: 'common',
  resources: getTranslations(localisationFolder),
}

module.exports = site
