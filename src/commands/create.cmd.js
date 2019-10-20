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
    .command('create <what> <name>')
    .description('initialize new iio web/desktop application or service project named <name> (<what> = ' + bootstrapTypesDescription + ')')
    .option('-p, --path <path>', 'set destination directory path. defaults to ./<name>')
    .option('-l, --lang <language>', 'set programming language: py, js (default: js)')
    .option('-t, --tag <version_tag>', 'selects specific version thanks to git tags. Could be branch name as well')
    .action(function(what, name, options) {
      options.lang = options.lang || 'js'

      if (languages.indexOf(options.lang) === -1) {
        console.log('language ' + options.lang + ' is not supported. Exiting...')
        process.exit(1)
      }

      console.log('selected lang: [%s]', options.lang)

      let availableBootstraps = []
      let defaultBootstraps = {}

      for (let bs in config.apps[options.lang]) {
        if (config.apps[options.lang][bs].repo) {
          availableBootstraps.push(bs)
        } else {
          for (let variant in config.apps[options.lang][bs]) {
            if (config.apps[options.lang][bs][variant].default) {
              defaultBootstraps[bs] = bs + ':' + variant
            }
            availableBootstraps.push(bs + ':' + variant)
          }
        }
      }

      let currentBootstrapIndex = availableBootstraps.indexOf(what)
      if (currentBootstrapIndex === -1) {
        if (!defaultBootstraps[what]) {
          console.error('bootstrap template [' + what + '] is not supported. Exiting...')
          process.exit(1)
        }
      }

      let cloneOpts = [ '--depth=1' ]

      if (options.tag) {
        cloneOpts.push('--branch=' + options.tag)
      }

      let repo
      let variant

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
        case 'service':
          destPath = path.join(options.path || destPath, name + '-service')
          repo = config.apps[options.lang].service.repo

          if (!loweredName.match(/^[a-z]+$/)) {
            console.log('service name must contain only letters from a to z or A to Z.')
            utils.cleanupAndExit(loweredName)
          }

          git.clone(repo, destPath, cloneOpts, async () => {
            await utils.renameDirs(destPath, loweredName)

            recursive(destPath, (err, files) => {
              // `files` is an array of absolute file paths
              for (let file of files) {
                if (path.basename(file).match('Iiost')) {
                  fs.move(file, file.replace('Iiost', upperedName))
                }

                if (path.basename(file).match('iiost')) {
                  fs.move(file, file.replace('iiost', loweredName))
                }
              }

              replace({
                regex: 'iiost',
                replacement: loweredName,
                paths: [ destPath ],
                recursive: true,
                silent: true,
              })

              replace({
                regex: 'Iiost',
                replacement: upperedName,
                paths: [ destPath ],
                recursive: true,
                silent: true,
              })

              rimraf(path.join(destPath, '.git'), () => {
                console.log('done')
              })
            })
          })
          break
        case 'desktop':
          destPath = path.join(options.path || destPath, name)

          repo = config.apps[options.lang].desktop.repo

          git.clone(repo, destPath, cloneOpts, () => {
            replace({
              regex: 'iioeat',
              replacement: loweredName,
              paths: [ destPath ],
              recursive: true,
              silent: true,
            })

            rimraf(path.join(destPath, '.git'), () => {
              console.log('done')
            })
          })
          break
        default:
          let variantConfig

          if (variant) {
            variantConfig = config.apps[options.lang][what][variant]
          } else {
            variantConfig = config.apps[options.lang][what]
          }

          repo = variantConfig.repo

          if (!repo) {
            console.error('repo name missing')
          }

          destPath = path.join(options.path || destPath, name)

          let textReplacements = variantConfig.textReplacements

          git.clone(repo, destPath, cloneOpts, () => {
            // `files` is an array of absolute file paths
            if (variantConfig.filanameReplacements) {
              for (let filename in variantConfig.filanameReplacements) {
                if (path.basename(file).match(filename)) {
                  let newFilename
                  switch (variantConfig.filanameReplacements[filename]) {
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

                  fs.move(file, file.replace(filename, newFilename))
                }
              }
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

            rimraf(path.join(destPath, '.git'), () => {
              console.log('done')
            })
          })
      }
    })
}
