const aspectRatio = ({ width, height }) => {
  const ratio = (width / height)

  switch (true) {
  case (ratio >= 3):
    return 'panorama'
  case (ratio === 1):
    return 'square'
  case (ratio < 1):
    return 'portrait'
  case (ratio > 1):
    return 'landscape'
  default:
    return 'unknown'
  }
}

module.exports = aspectRatio
