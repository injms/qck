module.exports = {
  layout: 'photo.njk',
  type: 'photo',
  language: 'en-gb',
  permalink: '/{{ language | slug }}/{{ "url:photos" | i18nbare: language | slug }}/{{ title | slug }}/',
}
