/**
 * Eleventy defaults to ending URLs with a trailing slash; using Node's `path`
 * will lead to paths (and therefore URLs) without a trailing this. This is a
 * little thing to ensure that strings end with a trailing slash.
 *
 * @function
 * @name cleanKey
 * @param  {string} string the string that needs checking to see whether it
 * has a trailing slash on the end.
 * @returns {string} the string with a trailing slash at the end when
 * needed.
 */
const cleanKey = (string) => string.endsWith('/') ? string : `${string}/`

module.exports = cleanKey
