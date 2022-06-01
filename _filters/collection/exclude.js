const cleanKey = require('../../_helpers/cleanKey')

const exclude = function (collection, exclusions = []) {
  if (typeof exclusions === 'string') {
    exclusions = [exclusions]
  }

  exclusions = exclusions
    .filter(exclusion => !!exclusion)
    .map(exclusion => cleanKey(exclusion))

  return collection
    .filter(({ data: { alternativeKey } }) => !exclusions.includes(alternativeKey))
}

module.exports = exclude
