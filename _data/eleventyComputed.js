const exifr = require('exifr')
const i18next = require('i18next')
const Jimp = require('jimp')

const { basename, dirname, extname, join } = require('path')
const { readdirSync } = require('fs')

const cleanKey = require('../_helpers/cleanKey')
const aspectRatio = require('../_helpers/calculateAspectRatio')

const site = require('./site')

module.exports = {
  metadata: function ({ metadata, language }) {
    const i18n = i18next.createInstance()
    i18n.init(site.i18n)

    const defaults = {
      description: i18n.t('site_default_description', { lng: language }),
    }

    return Object.assign(defaults, metadata)
  },
  layout: function ({ layout }) {
    return layout || 'default'
  },
  projectKey: function ({ project }) {
    if (project) {
      return project.replace(' ', '_').toLowerCase()
    }
  },
  image: function ({ image, type, page }) {
    if (image) return image

    if (type === 'photo') {
      const base = basename(page.inputPath, '.md')
      const folder = dirname(page.inputPath)

      const file = readdirSync(folder)
        .filter(filename => {
          return extname(filename) === '.jpg'
        })
        .filter(filename => {
          return basename(filename, '.jpg') === base
        })

      if (file.length >= 1) return join(folder, file[0])
    }
  },
  imageMetadata: async function ({ imageMetadata, type, image }) {
    if (imageMetadata) return imageMetadata

    if (type === 'photo' && image !== '' && image !== undefined) {
      const metadata = await exifr.parse(image)
      const thumbnail = await exifr.thumbnail(image)

      const img = await Jimp.read(thumbnail)

      const { width, height } = img.bitmap

      metadata.Model = metadata.Model.replace(/DIGITAL/, '').trim()

      metadata.LensModel = metadata.LensModel
        .replace(/\.0/g, '') // Remove trailing decimals: `200.0` to `200`
        .replace(/\smm/, 'mm') // Remove space between number and `mm`
        .replace(/-/g, '&mdash;') // Replace hypher with mdash.
        .trim()

      metadata.aspectRatio = aspectRatio({
        width,
        height,
      })

      metadata.thumbnail = await img
        .clone()
        .scaleToFit(20, 20)
        .getBase64Async(Jimp.MIME_JPEG)

      return metadata
    }
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
  alternativeKey: function ({ alternativeKey, page: { inputPath } }) {
    if (alternativeKey) return alternativeKey

    return cleanKey(dirname(inputPath))
  },
  feedKey: function ({ feedKey, page: { inputPath, filePathStem } }) {
    if (feedKey) return feedKey

    const pageFolder = inputPath
      .replace(filePathStem, '')
      .replace(extname(inputPath), '')

    // Feeds can require a unique ID for each page, usually based on the URL.
    // This removes the trailing slashes, and replaces the middle slashes with
    // colons.
    // For example:
    //    /one/two/three/four/ => one:two:three:four
    //    /photos/beautiful-sunset/ => photos:beautiful-sunset
    //    /about/ => about
    const key = cleanKey(dirname(inputPath))
      .replace(pageFolder, '')
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .replace(/\//, ':')

    return key
  },
  pageID: function ({ pageID, page: { inputPath } }) {
    if (pageID) return pageID

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
