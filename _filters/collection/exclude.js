const exclude = function (collection, exclusions = []) {
  if (typeof exclusions === 'string') {
    exclusions = [exclusions]
  }

  exclusions = exclusions
    .filter(exclusion => !!exclusion)
    .map(exclusion => exclusion)

  return collection
    .filter(({ data: { alternativeKey } }) => !exclusions.includes(alternativeKey))
}

export default exclude
