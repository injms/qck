const getTranslations = require('../_helpers/getTranslations')

// All the default data and settings. Default strings go into the i18n files.
const site = {
  defaultLanguage: 'en-gb',
  production: process.env.CONTEXT === 'production',
  pseudoLocalisation: process.env.PSEUDOL10N === 'true',
  baseURL: process.env.CONTEXT === 'production' ? process.env.URL : process.env.DEPLOY_PRIME_URL,
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

site.i18n = {
  debug: false,
  fallbackLng: site.defaultLanguage,
  lowerCaseLng: true,
  ns: ['common', 'url', 'project'],
  defaultNS: 'common',
  resources: getTranslations('_locales'),
}

module.exports = site
