const limitTo = function (collection, limit = 3) {
  return collection.slice(0, limit)
}

module.exports = limitTo
