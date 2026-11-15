import path from 'node:path'
import site from '../_data/site.js'

/**
 * Generates a clean key from the page path.
 *
 * @function
 * @name cleanKey
 * @param  {string} string the path or local URI that needs converting to a key
 * @returns {string} the generated key
 */
const cleanKey = (string) => {
  return path.normalize(string.trim()) // normalises the path by removing the `./` at the base, allowing for easier splitting.
    .split(path.sep)
    .filter(Boolean)
    .filter(folder => folder !== site.basePagesFolder) // removes the base folder from the path - all items are in this folder, so having it at the start of the key is redundant.
    .join('::') // prefer this to demarcate folders and items
}

export default cleanKey
