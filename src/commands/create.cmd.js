const cli = require('commander')
const fs = require('fs-extra')
const path = require('path')
const git = require('simple-git')()
const replace = require('replace')
const rimraf = require('rimraf')
const recursive = require('recursive-readdir')

const utils = require('../utils')

module.exports = function(config) {
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
    .action(function(what, name) {
      cli.lang = cli.lang || 'js'
      if (languages.indexOf(cli.lang) === -1) {
        console.log('language ' + cli.lang + ' is not supported. Exiting...')
        process.exit(1)
      }

      console.log('selected lang: ', cli.lang)
      let availableBootstraps = Object.keys(config.apps[cli.lang])
      let currentBootstrapIndex = availableBootstraps.indexOf(what)
      if (currentBootstrapIndex === -1) {
        console.log('bootstrap template ' + what + ' is not supported. Exiting...')
        process.exit(1)
      }

      let repo

      let loweredName = name.toLowerCase()
      let upperedName = loweredName.slice(0,1).toUpperCase() + loweredName.slice(1)

      switch (what) {
        case 'service':
          config.destPath = path.join(cli.path || config.destPath, name + '-service')
          repo = config.apps[cli.lang].service.repo

          if (!loweredName.match(/^[a-z]+$/)) {
            console.log('service name must contain only letters from a to z or A to Z.')
            utils.cleanupAndExit(loweredName)
          }

          git.clone(repo, config.destPath, async () => {
            await utils.renameDirs(config.destPath, loweredName)

            recursive(config.destPath, (err, files) => {
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
                paths: [ config.destPath ],
                recursive: true,
                silent: true,
              })

              replace({
                regex: 'Iiost',
                replacement: upperedName,
                paths: [ config.destPath ],
                recursive: true,
                silent: true,
              })

              rimraf(path.join(config.destPath, '.git'), () => {
                console.log('done')
              })
            })
          })
          break
        case 'app':
          config.destPath = path.join(cli.path || config.destPath, name)

          repo = config.apps[cli.lang].app.repo

          git.clone(repo, config.destPath, () => {
            recursive(config.destPath, (err, files) => {
              // `files` is an array of absolute file paths
              for (let file of files) {
                if (path.basename(file).match('ignitialio')) {
                  fs.move(file, file.replace('ignitialio', loweredName))
                }
              }

              replace({
                regex: 'iioat',
                replacement: loweredName,
                paths: [ config.destPath ],
                recursive: true,
                silent: true,
              })

              replace({
                regex: '@ignitial/iio-app-nxt',
                replacement: loweredName,
                paths: [ config.destPath ],
                recursive: true,
                silent: true,
              })

              replace({
                regex: 'IgnitialIO',
                replacement: name,
                paths: [ config.destPath ],
                recursive: true,
                silent: true,
              })

              replace({
                regex: 'ignitialio',
                replacement: loweredName,
                paths: [ config.destPath ],
                recursive: true,
                silent: true,
              })

              rimraf(path.join(config.destPath, '.git'), () => {
                console.log('done')
              })
            })
          })
          break
        case 'desktop':
          config.destPath = path.join(cli.path || config.destPath, name)

          repo = config.apps[cli.lang].desktop.repo

          git.clone(repo, config.destPath, () => {
            replace({
              regex: 'iioeat',
              replacement: loweredName,
              paths: [ config.destPath ],
              recursive: true,
              silent: true,
            })

            rimraf(path.join(config.destPath, '.git'), () => {
              console.log('done')
            })
          })
          break
        default:
          repo = config.apps[cli.lang][what].repo
          config.destPath = path.join(cli.path || config.destPath, name)

          let replacements = config.apps[cli.lang][what].replacements

          git.clone(repo, config.destPath, () => {
            for (let replacement in replacements) {
              let replType
              switch (replacements[replacement]) {
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
                paths: [ config.destPath ],
                recursive: true,
                silent: true,
              })
            }

            rimraf(path.join(config.destPath, '.git'), () => {
              console.log('done')
            })
          })
      }
    })
}
