const fs = require('fs-extra')
const path = require('path')
const git = require('simple-git')()
const replace = require('replace')
const recursive = require('recursive-readdir')

const utils = require('../utils')
const txtRed = utils.txtRed
const txtOrange = utils.txtOrange
const rimraf = utils.rimraf

module.exports = function(config, what, name, options) {
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

  options.lang = options.lang || 'js'

  if (languages.indexOf(options.lang) === -1) {
    console.error(txtRed('language ' + options.lang + ' is not supported. exiting...'))
    process.exit(1)
  }

  console.log(txtOrange('language: ' + options.lang))

  let availableBootstraps = []
  // reference default variant when variant option missing
  // ex: app === app:material since material is default
  let defaultBootstraps = {}

  for (let bs in templates[options.lang]) {
    if (templates[options.lang][bs].repo) {
      availableBootstraps.push(bs)
    } else {
      for (let variant in templates[options.lang][bs]) {
        if (templates[options.lang][bs][variant].default) {
          defaultBootstraps[bs] = bs + ':' + variant
        }
        availableBootstraps.push(bs + ':' + variant)
      }
    }
  }

  let currentBootstrapIndex = availableBootstraps.indexOf(what)
  if (currentBootstrapIndex === -1) {
    if (!defaultBootstraps[what]) {
      console.error(txtRed('bootstrap template [' + what + '] is not supported. exiting...'))
      process.exit(1)
    }
  }

  let cloneOpts = [ '--depth=1' ]

  if (options.tag) {
    cloneOpts.push('--branch=' + options.tag)
  }

  let repo
  let variant
  let message

  let loweredName = name.toLowerCase()
  let upperedName = loweredName.slice(0,1).toUpperCase() + loweredName.slice(1)

  if (what.match(':')) {
    let wwhat = what.split(':')
    what = wwhat[0]
    variant = wwhat[1]
  } else {
    if (defaultBootstraps[what]) {
      let wwhat = defaultBootstraps[what].split(':')
      what = wwhat[0]
      variant = wwhat[1]
    }
  }

  switch (what) {
    // future possible specific cases: for now, everything is done thanks to
    // the YAML config and, then, only default case
    default:
      let variantConfig

      if (variant) {
        variantConfig = templates[options.lang][what][variant]
      } else {
        variantConfig = templates[options.lang][what]
      }

      repo = variantConfig.repo
      message = variantConfig.message

      if (variantConfig.namingRules && !loweredName.match(new RegExp(variantConfig.namingRules))) {
        console.error(txtRed(what + ' name must match /' + variantConfig.namingRules + '/'))
        utils.cleanupAndExit(loweredName)
      }

      if (!repo) {
        console.error(txtRed('repo name missing'))
        process.exit(1)
      }

      destPath = path.join(options.path || destPath,
        name + (variantConfig.nameSuffix || ''))

      let textReplacements = variantConfig.textReplacements

      git.clone(repo, destPath, cloneOpts, async () => {
        await rimraf(path.join(destPath, '.git'))

        // `files` is an array of absolute file paths
        if (variantConfig.filenameReplacements) {
          recursive(destPath, (err, files) => {
            // `files` is an array of absolute file paths
            for (let file of files) {
              for (let filenameMatch in variantConfig.filenameReplacements) {
                if (path.basename(file).match(filenameMatch)) {
                  let newFilename
                  switch (variantConfig.filenameReplacements[filenameMatch]) {
                    case 'lowerCaseAppName':
                      newFilename = loweredName
                      break
                    case 'appName':
                      newFilename = name
                      break
                    case 'upperCaseAppName':
                      newFilename = upperedName
                    default:
                      newFilename = name
                  }

                  fs.moveSync(file, file.replace(filenameMatch, newFilename))
                }
              }
            }
          })
        }

        for (let replacement in textReplacements) {
          let replType
          switch (textReplacements[replacement]) {
            case 'lowerCaseAppName':
              replType = loweredName
              break
            case 'appName':
              replType = name
              break
            case 'upperCaseAppName':
              replType = upperedName
            default:
              replType = name
          }

          replace({
            regex: replacement,
            replacement: replType,
            paths: [ destPath ],
            recursive: true,
            silent: true,
          })
        }

        console.log(txtOrange(message))
        console.log('creation done.')
      })
  }
}
