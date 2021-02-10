const _ = {
  get: require('lodash/get'),
  set: require('lodash/set'),
}

const site = require('../_data/site')

/**
 * The query function allows us to ask a specific collection for certain pages
 * with specific paraameters returned in specific locales - for example, the
 * contact page's title and metadata in Spanish; or we can ask for every single
 * page's title and slug in all languages; or we can ask for the first 3 pages
 * from the photo collection in French.
 *
 * Sort of follows the way SQL does things.
 *
 * @param {queryConfig} config
 * @param {(string | string[])} config.select=* Which bits of the page to return - eg title, permalink, content...
 * @param {string | string[]} config.where=* Conditions eg `locale = en-gb`
 * @param {string} config.orderBy='date desc' The key and the direction in which to order things.
 * @param {number} config.limit - The number of results to be returned. Defaults to no limit.
 *
 * @returns {Object[]} Collection of pages that fit the query's criteria.
 */
const q = function ({
  select = '*',
  where,
  orderBy = 'date desc',
  limit,
} = {
  select: '*',
  orderBy: 'date desc',
}) {
  if (typeof select === 'string') select = [select]
  if (typeof where === 'string') where = [where]

  const collection = this

  const queriedCollection = collection
    .sort((a, b) => {
      // Reverse so that order is always first, even if no parameter is given.
      // eg 'ASC' is valid and would give ['ASC']; 'date ASC' is also valid and
      // would give ['ASC', 'date']; 'date' is not valid as it has no direciton.
      // Default parameter is date, default order is descending
      const [order, parameter = 'date'] = orderBy.split(' ').reverse()

      const aParam = _.get(a, parameter)
      const bParam = _.get(b, parameter)

      // This will flip a negative to a positive and a positive to a negative
      // because a negative multiplied by a positive gives a negative number,
      // and a negative multipled by a negative makes a positive number.
      // Defaults to -1 or DESC.
      const ascOrDescModifier = order.toLowerCase() === 'asc' ? 1 : -1

      if (parameter === 'date') {
        return Math.sign(aParam - bParam) * ascOrDescModifier
      }

      if (typeof aParam === 'string') {
        const sortNumber = aParam.localeCompare(bParam)

        return sortNumber * ascOrDescModifier
      }

      return 0
    })
    .filter((page) => {
      if (!where) return page

      const a = where.map(condition => {
        const [parameter, operator, key] = condition.split(' ')

        const requestedParameter = _.get(page, parameter)

        switch (operator) {
        case '=':
          return requestedParameter === key
        case '>':
          return requestedParameter > key
        case '<':
          return requestedParameter < key
        case '>=':
          return requestedParameter >= key
        case '<=':
          return requestedParameter <= key
        default:
          console.error('Operator not recognised.')
          return false
        }
      })

      // Only all true should return true (eg [true, true, true])
      // Presence of >= one false should give false.w
      return !a.includes(false)
    })
    .map((page) => {
      if (select.includes('*')) return page

      const pageSelection = {}

      select.forEach(parameter => {
        const requestedParameter = _.get(page, parameter)

        if (requestedParameter) {
          _.set(pageSelection, parameter, requestedParameter)
        } else {
          console.error(`Parameter \`${parameter}\` not present for ${page.data.page.inputPath}`)
        }
      })

      return Object.keys(page).length > 0 ? pageSelection : null
    })
    .filter((page) => !!page)
    .slice(0, limit)

  return queriedCollection
}

module.exports = q
