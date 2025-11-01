const limitTo = function (collection, limit = 3) {
  return collection.slice(0, limit)
}

export default limitTo
