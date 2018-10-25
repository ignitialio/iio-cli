#!/usr/bin/env node

const cli = require('commander')
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')
const recursive = require('recursive-readdir')
const exec = require('child_process').execSync
const git = require('simple-git')()
const replace = require('replace')
const rimraf = require('rimraf')

let pckageJSON = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
let version = JSON.parse(pckageJSON).version
let appTemplateGitRepo = 'https://gitlab.com/iio-core/iio-app-template.git'
let srvTemplateGitRepoJS = 'https://gitlab.com/iio-core/iio-svc-template.git'
let destPath = '.'

cli
  .version(version, '-v, --version')
  .usage('[options] <command>')
  .option('-p, --path <path>', 'set destination directory path. defaults to ./<name>')
  .option('-a, --author <author>', 'set author')
  .option('-l, --lang <language>', 'set programming language: py, js, go')

cli
  .command('create <what> <name>')
  .description('initialize new iio application or service project')
  .action(function(what, name) {
    if (what === 'service') {
      destPath = path.join(cli.path || destPath, name + '-service')
      let srvTemplateGitRepo
      switch (cli.lang) {
        case 'py':
          srvTemplateGitRepo = srvTemplateGitRepoJS
          break;
        default:
          srvTemplateGitRepo = srvTemplateGitRepoJS
      }
      let loweredName = name.toLowerCase()
      let upperedName = loweredName.slice(0,1).toUpperCase() + loweredName.slice(1)

      git.clone(srvTemplateGitRepo, destPath, () => {
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
    } else if (what === 'app') {
      destPath = path.join(cli.path || destPath, name)
      git.clone(appTemplateGitRepo, destPath, () => {
        replace({
          regex: 'iioat',
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

        rimraf(path.join(destPath, '.git'), () => {
          console.log('done')
        })
      })
    } else {
      console.log(chalk.red('<what> option must be either "service" or "app"'))
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
