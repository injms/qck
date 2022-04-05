const exclude = function (collection, exclusions = []) {
  if (typeof exclusions === 'string') {
    exclusions = [exclusions]
  }

  return collection
    .filter(({ data: { alternativeKey } }) => !exclusions.includes(alternativeKey))
}

module.exports = exclude
