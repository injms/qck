const _ = {
  get: require('lodash/get'),
  set: require('lodash/set'),
}

/**
 * The query function allows us to ask a specific collection for certain pages
 * with specific paraameters returned in specific locales - for example, the
 * contact page's title and metadata in Spanish; or we can ask for every single
 * page's title and slug in all languages; or we can ask for the first 3 pages
 * from the photo collection in French.
 *
 * @param {queryConfig } config
 * @param {(string | string[])} config.columns=* Which bits of the page to return - eg title, permalink, content...
 * @param {(string | string[])} config.rows=* The `alternativeKey` id of the page to return.
 * @param {(string | string[])} config.locales=* The locale of the page requested
 * @param {string} config.collectionName=all Which collection to search through.
 * @param {number} config.limit - The number of results to be returned. Defaults to no limit.
 *
 * @returns {Object[]} Collection of pages that fit the query's criteria.
 */
const query = function ({
  columns = '*',
  rows = '*',
  locales = '*',
  collectionName = 'all',
  limit,
}) {
  if (typeof keys === 'string') rows = [rows]
  if (typeof parameters === 'string') columns = [columns]
  if (typeof locales === 'string') locales = [locales]

  const collection = this.ctx.collections?.[collectionName] || this.ctx.collections.all

  return collection
    .filter(({ data: { alternativeKey } }) => {
      if (rows.includes('*')) return true

      return rows.includes(alternativeKey)
    })
    .filter(({ data: { language } }) => {
      if (columns.includes('*')) return true

      return locales.includes(language)
    })
    .map(({ data }) => {
      if (columns.includes('*')) return data

      const page = {}

      columns.forEach(parameter => {
        const deepParameter = parameter.split('.').filter(x => !!x)
        const requestedParameter = _.get(
          data,
          deepParameter,
        )

        if (requestedParameter) {
          _.set(page, parameter, requestedParameter)
        } else {
          console.error(`Parameter \`${parameter}\` not present`)
        }
      })

      return page
    })
    .slice(0, limit)
}

module.exports = query
