const cli = require('commander')
const fs = require('fs-extra')
const path = require('path')
const git = require('simple-git')()
const replace = require('replace')
const rimraf = require('rimraf')
const recursive = require('recursive-readdir')
const txtRed = require('../utils').txtRed
const txtOrange = require('../utils').txtOrange

const utils = require('../utils')

module.exports = function(config) {
  let templates = config.apps.templates
  let destPath = '.'
  let languages = Object.keys(templates)
  let bootstrapTypes = [ 'service', 'app', 'desktop' ]

  for (let l in templates) {
    for (let t in templates[l]) {
      if (bootstrapTypes.indexOf(t) === -1) {
        bootstrapTypes.push(t)
      }
    }
  }

  let bootstrapTypesDescription = bootstrapTypes.join('|')

  cli
    .command('templates')
    .description('list available templates for a given language')
    .option('-l, --lang <language>', 'set programming language: py, js (default: js)')
    .action(function(options) {
      options.lang = options.lang || 'js'

      if (languages.indexOf(options.lang) === -1) {
        console.error(txtRed('language ' + options.lang + ' is not supported. exiting...'))
        process.exit(1)
      }

      console.log(txtOrange('language: ' + options.lang))

      console.log('available templates for [' + options.lang + '] language:')
      for (let template in templates[options.lang]) {
        if (templates[options.lang][template].repo) {
          console.log('\t[' + template + '] : ' + templates[options.lang][template].description)
        } else {
          console.log('\t[' + template + '] variants: ')
          for (let variant in templates[options.lang][template]) {
            console.log('\t\t[' + template + ':' + variant + '] : ' + templates[options.lang][template][variant].description)
          }
        }
      }
    })
}
