#!/usr/bin/env node

const cli = require('commander')
const chalk = require('chalk')
const fs = require('fs-extra')
const yaml = require('yaml')
const path = require('path')
const recursive = require('recursive-readdir')
const exec = require('child_process').execSync
const git = require('simple-git')()
const replace = require('replace')
const rimraf = require('rimraf')
const listDirectories = require('list-directories')

let config = yaml.parse(fs.readFileSync('./config/sample.yaml', 'utf8'))

const cfgPath = path.join('/home', process.env.USER, '.iio')
if (fs.existsSync(cfgPath)) {
  config = yaml.parse(fs.readFileSync(cfgPath, 'utf8'))
  console.log('get config from user file')
} else {
  fs.writeFileSync(cfgPath, yaml.stringify(config), 'utf8')
  console.log('get config from default sample')
}

let languages = Object.keys(config)
let bootstrapTypes = [ 'service', 'app', 'desktop' ]

for (let l in config) {
  for (let t in config[l]) {
    if (bootstrapTypes.indexOf(t) === -1) {
      bootstrapTypes.push(t)
    }
  }
}

let bootstrapTypesDescription = bootstrapTypes.join('|')
let packageDef = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
let version = JSON.parse(packageDef).version

let destPath = '.'

function cleanupAndExit(loweredName, servicePath) {
  console.log('creation of service ' + loweredName + ' failed')
  if (servicePath && fs.existsSync(servicePath)) {
    console.log('deleting directory', servicePath)
    fs.removeSync(servicePath)
  }
  process.exit(1)
}

async function renameDirs(dirPath, loweredName, servicePath) {
  if (path.basename(dirPath).match('.git')) return
  servicePath = servicePath || dirPath
  if (path.basename(dirPath).match('iiost')) {
    let oldDirPath = dirPath
    dirPath = path.join(path.dirname(oldDirPath), loweredName)
    if (fs.existsSync(dirPath)) {
      console.log('cannot recreate existing directory', dirPath,
      '\ntry giving your service a different name.')
      cleanupAndExit(loweredName, servicePath)
    }
    fs.moveSync(oldDirPath, dirPath)
  }
  let childDirPaths = await listDirectories(dirPath)
  for (let childDirPath of childDirPaths.values()) {
    await renameDirs(childDirPath, loweredName, servicePath)
  }
}

cli
  .version(version, '-v, --version')
  .usage('[options] <command>')
  .option('-p, --path <path>', 'set destination directory path. defaults to ./<name>')
  .option('-a, --author <author>', 'set author')
  .option('-l, --lang <language>', 'set programming language: py, js (default: js)')

cli
  .command('create <what> <name>')
  .description('initialize new iio web/desktop application or service project (' + bootstrapTypesDescription + ')')
  .action(function(what, name) {
    cli.lang = cli.lang || 'js'
    if (languages.indexOf(cli.lang) === -1) {
      console.log('language ' + cli.lang + ' is not supported. Exiting...')
      process.exit(1)
    }

    console.log('selected lang: ', cli.lang)
    let availableBootstraps = Object.keys(config[cli.lang])
    let currentBootstrapIndex = availableBootstraps.indexOf(what)
    if (currentBootstrapIndex === -1) {
      console.log('bootstrap template ' + what + ' is not supported. Exiting...')
      process.exit(1)
    }

    let repo

    switch (what) {
      case 'service':
        destPath = path.join(cli.path || destPath, name + '-service')
        repo = config[cli.lang].service.repo

        let loweredName = name.toLowerCase()
        let upperedName = loweredName.slice(0,1).toUpperCase() + loweredName.slice(1)

        if (!loweredName.match(/^[a-z]+$/)) {
          console.log('service name must only contain letters from a to z or A to Z.')
          cleanupAndExit(loweredName)
        }

        git.clone(repo, destPath, async () => {
          await renameDirs(destPath, loweredName)

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
      case 'app':
        destPath = path.join(cli.path || destPath, name)

        repo = config[cli.lang].app.repo

        git.clone(repo, destPath, () => {
          recursive(destPath, (err, files) => {
            // `files` is an array of absolute file paths
            for (let file of files) {
              if (path.basename(file).match('ignitialio')) {
                fs.move(file, file.replace('ignitialio', name.toLowerCase()))
              }
            }

            replace({
              regex: 'iioat',
              replacement: name.toLowerCase(),
              paths: [ destPath ],
              recursive: true,
              silent: true,
            })

            replace({
              regex: '@ignitial/iio-app-nxt',
              replacement: name.toLowerCase(),
              paths: [ destPath ],
              recursive: true,
              silent: true,
            })

            replace({
              regex: 'IgnitialIO',
              replacement: name,
              paths: [ destPath ],
              recursive: true,
              silent: true,
            })

            replace({
              regex: 'ignitialio',
              replacement: name.toLowerCase(),
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
        destPath = path.join(cli.path || destPath, name)

        repo = config[cli.lang].desktop.repo

        git.clone(repo, destPath, () => {
          replace({
            regex: 'iioeat',
            replacement: name.toLowerCase(),
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
        repo = config[cli.lang][what].repo
        destPath = path.join(cli.path || destPath, name)

        let replacements = config[cli.lang][what].replacements

        git.clone(repo, destPath, () => {
          for (let replacement in replacements) {
            let replType
            switch (replacements[replacement]) {
              case 'lowerCaseAppName':
                replType = name.toLowerCase()
                break
              case 'appName':
                replType = name
                break
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

cli
  .command('update <name>')
  .description('updates library for all child folders. Useful for iio-services update for all services')
  .option("-v, --version <version>", "lib version. Default to latest")
  .action(function(name, options) {
    let cwd = process.cwd()
    destPath = path.join(process.cwd(), cli.path || destPath)

    let exists = fs.existsSync(destPath)

    if (exists) {
      let folders = fs.readdirSync(destPath)

      for (let folder of folders) {
        let targetFolder = path.join(destPath, folder)

        process.chdir(targetFolder)

        console.log('call update [%s] for [%s]', name, targetFolder)

        exec('npm update ' + name + ' --save')
      }
    } else {
      console.error('destination folder missing')
    }

    console.log('done')
  })

cli
  .command('build <name1>,...,<nameN>')
  .description('builds Docker containers for named services')
  .action(function(services, options) {
    services = services.split(',')

    let cwd = process.cwd()
    destPath = path.join(process.cwd(), cli.path || destPath)

    let exists = fs.existsSync(destPath)

    if (exists) {
      let folders = fs.readdirSync(destPath)

      for (let folder of folders) {
        let service = folder.replace('-service', '')
        if (services.indexOf(service) >= 0) {
          let targetFolder = path.join(destPath, folder)

          process.chdir(targetFolder)

          console.log('docker build . --rm --force-rm -t ignitial/' + service + '-service')
          exec('docker build . --rm --force-rm -t ignitial/' + service + '-service')
        }
      }
    }

    console.log('done')
  })

if (!process.argv.slice(2).length) {
  cli.outputHelp(make_orange)
}

cli.parse(process.argv)

function make_orange(txt) {
  return chalk.rgb(255, 165, 0)(txt) //display the help text in red on the console
}
