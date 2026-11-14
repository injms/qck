const speciesify = (string) => {
  return string.replace(/^_/, '<i>').replace(/_$/, '</i>')
}

export default speciesify
