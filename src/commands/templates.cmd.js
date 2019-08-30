const cli = require('commander')
const fs = require('fs-extra')
const path = require('path')
const git = require('simple-git')()
const replace = require('replace')
const rimraf = require('rimraf')
const recursive = require('recursive-readdir')

const utils = require('../utils')

module.exports = function(config) {
  let destPath = '.'
  let languages = Object.keys(config.apps)
  let bootstrapTypes = [ 'service', 'app', 'desktop' ]

  for (let l in config.apps) {
    for (let t in config.apps[l]) {
      if (bootstrapTypes.indexOf(t) === -1) {
        bootstrapTypes.push(t)
      }
    }
  }

  let bootstrapTypesDescription = bootstrapTypes.join('|')

  cli
    .command('templates')
    .description('list available templates to use with [create] for a given language')
    .option('-l, --lang <language>', 'set programming language: py, js (default: js)')
    .action(function(options) {
      options.lang = options.lang || 'js'

      if (languages.indexOf(options.lang) === -1) {
        console.log('language ' + options.lang + ' is not supported. Exiting...')
        process.exit(1)
      }

      console.log('selected lang: [%s]', options.lang)

      console.log('available templates for [' + options.lang + '] language:')
      for (let template in config.apps[options.lang]) {
        if (config.apps[options.lang][template].repo) {
          console.log('\t[' + template + '] : ' + config.apps[options.lang][template].description)
        } else {
          console.log('\t[' + template + '] variants: ')
          for (let variant in config.apps[options.lang][template]) {
            console.log('\t\t[' + template + ':' + variant + '] : ' + config.apps[options.lang][template][variant].description)
          }
        }
      }
    })
}
