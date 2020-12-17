const { readdirSync, readFileSync } = require('fs')
const { parse } = require('yaml')

const getTranslations = (localeDirectory = '_locales') => {
  const localeDirectoryContents = readdirSync(localeDirectory)
  const translations = {}

  localeDirectoryContents.forEach(file => {
    const yaml = readFileSync(`${localeDirectory}/${file}`, 'utf8')
    const parsedYaml = parse(yaml)

    Object.assign(translations, parsedYaml)
  })

  return translations
}

module.exports = getTranslations
