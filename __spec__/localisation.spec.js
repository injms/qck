const {
  existsSync,
  statSync,
  readFileSync,
} = require('fs')

const { load: cheerio } = require('cheerio')

const {
  assert,
  log,
} = console

const site = require('../_data/site')

const checkFolderStructure = () => {
  const expected = {
    directories: [
      'en-gb',
      'fr',
      'es',
    ],
    files: [
      'en-gb/index.html',
      'en-gb/about/index.html',
      'en-gb/photos/index.html',
      'en-gb/photos/first/index.html',
      'en-gb/photos/second/index.html',
      'en-gb/photos/third/index.html',
      'en-gb/photos/fourth/index.html',
      'en-gb/photos/fifth/index.html',
      'es/index.html',
      'es/sobre-mi/index.html',
      'fr/a-propos-de-moi/index.html',
      'fr/photos/premiere/index.html',
      'fr/photos/troisieme/index.html',
      'fr/photos/quatrieme/index.html',
    ],
  }

  expected.directories.forEach(directory => {
    assert(
      existsSync(`./site/${directory}`),
      `Directory '${directory}' does not exist.`,
    )

    assert(
      statSync(`./site/${directory}`).isDirectory() === true,
      `'${directory}' is not a directory.`,
    )
  })

  expected.files.forEach(file => {
    assert(
      existsSync(`./site/${file}`),
      `File '${file}' does not exist.`,
    )
    assert(
      statSync(`./site/${file}`).isDirectory() === false,
      `'${file}' is a directory.`,
    )
  })
}

const checkRelAlternate = () => {
  const expected = {
    length: 2,
    files: [
      'en-gb/about/index.html',
      'es/sobre-mi/index.html',
      'fr/a-propos-de-moi/index.html',
    ],
    href: [
      `${site.baseURL}/en-gb/about/`,
      `${site.baseURL}/es/sobre-mi/`,
      `${site.baseURL}/fr/a-propos-de-moi/`,
    ],
  }

  expected.files.forEach(file => {
    const markup = readFileSync(`./site/${file}`, 'utf-8')
    const $ = cheerio(markup)

    assert(
      $('link[rel="alternate"]').length === expected.length,
      `Incorrect number of link[rel="alternate"] - expected ${expected.length}, found ${$('a[rel="alternate"]').length}`,
    )

    $('link[rel="alternate"]').each((_k, { attribs }) => {
      assert(
        attribs.rel === 'alternate',
        'Incorrect rel type used on `link`',
      )
      assert(
        ['en-gb', 'es', 'fr'].includes(attribs.hreflang),
        'Incorrect hreflang on `link`',
      )
      assert(
        expected.href.includes(attribs.href),
        `Incorrect href on \`link\` in ${file} - expected one of ${JSON.stringify(expected.href)}, got ${attribs.href}`,
      )
    })

    assert(
      $('a[rel="alternate"]').length === expected.length,
      `Incorrect number of a[rel="alternate"] - expected ${expected.length}, found ${$('a[rel="alternate"]').length}`,
    )

    $('a[rel="alternate"]').each((_k, { attribs }) => {
      assert(
        attribs.rel === 'alternate',
        'Incorrect rel type used on `a`',
      )
      assert(
        attribs.hreflang === attribs.lang,
        'Incorrect hreflang on `a[rel="alternate"]`',
      )
      assert(
        expected.href.includes(attribs.href),
        `Incorrect href  on \`a\` in ${file} - expected one of ${JSON.stringify(expected.href)}, got ${attribs.href}`,
      )
    })
  })
}

const checkLinksInBody = () => {
  const expected = {
    length: 1,
    files: [
      'en-gb/about/index.html',
      'es/sobre-mi/index.html',
      'fr/a-propos-de-moi/index.html',
    ],
    homepageToLinkTo: {
      'en-gb': '/en-gb/',
      fr: '/en-gb/',
      es: '/es/',
    },
    linkHrefLang: {
      'en-gb': undefined,
      es: undefined,
      fr: 'en-gb',
    },
  }

  expected.files.forEach(file => {
    const markup = readFileSync(`./site/${file}`, 'utf-8')
    const $ = cheerio(markup)
    const lang = $('html').attr('lang')

    assert(
      $('#content a').length === expected.length,
      `Incorrect number of links in content - expected ${expected.length}, found ${$('a[rel="alternate"]').length}`,
    )

    assert(
      $('#content a').attr('href') === expected.homepageToLinkTo[lang],
      `Link does not link to correct locale - ${expected.homepageToLinkTo[lang]}, found ${$('#content a').attr('href')}`,
    )

    assert(
      $('#content a').attr('hreflang') === expected.linkHrefLang[lang],
      `Link does not contain correct hreflang - ${expected.linkHrefLang[lang]}, found ${$('#content a').attr('hreflang')}`,
    )
  })
}

log('Test suite started....')

checkFolderStructure()
checkRelAlternate()
checkLinksInBody()

log('Test suite complete.')
