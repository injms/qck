
const cloneDeep = require('lodash/cloneDeep')

const shuffle = function (collection) {
  const clonedCollection = cloneDeep(collection)

  for (let index = clonedCollection.length - 1; index > 0; index--) {
    const jdx = Math.floor(Math.random() * (index + 1))
    ;[clonedCollection[index], clonedCollection[jdx]] = [clonedCollection[jdx], clonedCollection[index]]
  }

  return clonedCollection
}

module.exports = shuffle
