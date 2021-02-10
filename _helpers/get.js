const _ = {
  get: require('lodash/get'),
}

const cleanKey = require('./cleanKey')
const q = require('./query')

const site = require('../_data/site')

/**
 * @param {Object} config
 * @param  {string} [config.collection='all'] Name of the collection to be queried.
 * Default is 'all' to query `collections.all`
 * @param  {string} config.key The page to return
 * @param  {string} [config.locale] The locale of the page to return
 * @param  {string} config.parameter The parameter from the page to return
 * @returns {Object} rtrn
 * @returns {string} rtrn.value
 * @returns {boolean} rtrn.fallback
 */
const get = function ({
  collectionName = 'all',
  key,
  locale,
  parameter,
}) {
  if (!parameter && !key) {
    throw new Error('No key or parameter supplied to `get` helper function.')
  }
  if (!key) {
    throw new Error('No key supplied to `get` helper function.')
  }
  if (!parameter) {
    throw new Error('No parameter supplied to `get` helper function.')
  }

  const query = q.bind(this.ctx.collections[collectionName] || this.ctx.collections.all)

  key = cleanKey(key)

  if (parameter !== 'date') parameter = `data.${parameter}`

  // The order of language override should be:
  //   1 - given locale from `locale` variable passed in
  //   2 - language of the page from `this.ctx.language`
  //   3 - the site's default language
  const desiredLanguage = (locale || this.ctx?.language) || site.defaultLanguage

  const [thisPageThisLanguage] = query({
    select: parameter,
    where: [
      `data.alternativeKey = ${key}`,
      `data.language = ${desiredLanguage}`,
    ],
    limit: 1,
  })

  const [thisPageFallbackLanguage] = query({
    select: parameter,
    where: [
      `data.alternativeKey = ${key}`,
      `data.language = ${site.defaultLanguage}`,
    ],
    limit: 1,
  })

  return {
    value: _.get(
      thisPageThisLanguage || thisPageFallbackLanguage,
      parameter,
    ),
    fallback: !!thisPageThisLanguage,
  }
}

module.exports = get
