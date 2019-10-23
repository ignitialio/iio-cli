const cli = require('commander')
const fs = require('fs-extra')
const path = require('path')
const spawn = require('child_process').spawn
const recursive = require('recursive-readdir')
const YAML = require('yaml')
const jp = require('jsonpath')
const _ = require('lodash')
const expandHomeDir = require('expand-home-dir')
const rimraf = require('rimraf').sync

let appPackageDef

function updateElement(which, data) {
  let result = which
  let matches = _.map(which.match(/\{\{(.*?)\}\}/g), e => e.replace('{{', '').replace('}}', ''))

  for (let m of matches) {
    let context = m.split('.')[0]

    switch (context) {
      case '$':
        let alt = jp.query(data, m)[0]
        if (!alt) {
          console.log('warning: json query [' + m + '] returned "undefined". will be replaced with empty string')
          alt = ''
        }
        if (typeof alt === 'string') {
          result = result.replace('{{' + m + '}}', alt)
        } else {
          result = alt
        }
        break
      case 'packageJSON':
        result = which.replace('{{' + m + '}}', jp.query(appPackageDef, m.replace('packageJSON', '$'))[0])
        break
      default:
        if (m.match(/filedata/)) {
          let url = m.match(/filedata\((.*?)\)/)[1]
          try {
            if (url.match('~')) {
              url = expandHomeDir(url)
            }
            let content = fs.readFileSync(url)
            // console.log(content.toString('base64'))
            result = which.replace('{{' + m + '}}', content.toString('base64'))
          } catch (err) {
            console.error(' config file [' + url + '] is missing')
            process.exit(1)
          }
        } else {
          console.log('weird value for property', m)
        }
    }
  }

  return result
}

function updateRefs(config, data) {
  data = data || config
  if (typeof config === 'object') {
    for (let prop in config) {
      if (typeof config[prop] === 'string') {
        let ref = config[prop].match(/\{\{(.*?)\}\}/g)
        if (ref) {
          //
          config[prop] = updateElement(config[prop], data)
          //config[prop] = ref[1] + jp.query(data, ref[2])[0]
        }
      } else {
        if (typeof config[prop] === 'object') {
          config[prop] = updateRefs(config[prop], data)
        }
      }
    }
  } else {
    if (typeof config === 'string') {
      let ref = config.match(/\{\{(.*?)\}\}/g)
      if (ref) {
        config[prop] = updateElement(config[prop], data)
        //config = ref[1] + jp.query(data, ref[2])[0]
      }
    }
  }

  return config
}

module.exports = function(config) {
  cli
    .command('config <target> <action>')
    .description('manage IIO app configuration (<target> = app|deploy, <action> = get|generate)')
    .option('-w, --workingDir <path>', 'set working directory path (default=.')
    .action(function(target, action, options) {
      let workingDirectory = path.resolve('.')
      let configFile
      let config

      if (options.workingDir) {
        workingDirectory = path.resolve(options.workingDir)
      }

      let templatesDirectory = path.join(workingDirectory, 'k8s', 'templates')
      appPackageDef = JSON.parse(fs.readFileSync(path.join(workingDirectory, 'package.json'), 'utf8'))

      let deployPath = path.join(workingDirectory, 'k8s', 'deploy')
      if (fs.existsSync(deployPath)) {
        rimraf(deployPath + '/*')
      } else {
        fs.mkdirSync(deployPath)
      }

      switch (target) {
        case 'app':
          configFile = path.join(workingDirectory, 'config', 'config.yaml')
          break
        case 'deploy':
          configFile = path.join(workingDirectory, 'k8s', 'config', 'deploy.yaml')
          break
        default:
          console.error('[' + target + '] target not available (<target> = app|deploy)')
          process.exit(1)
      }

      if (!fs.existsSync(configFile)) {
        console.error(' config file [' + configFile + '] is missing')
        process.exit(1)
      }

      try {
        config = fs.readFileSync(configFile, 'utf8')
        config = YAML.parse(config)
      } catch (err) {
        console.error('error when processing [' + target + '] config', err)
      }

      switch (action) {
        case 'get':
          config = updateRefs(config)
          console.log(JSON.stringify(config, null, 2))

          console.log('\ndone')
          break
        case 'generate':
          config = updateRefs(config)

          if (config.cluster.secrets) {
            for (let secret of config.cluster.secrets) {
              if (secret.file) {
                if (secret.file.match('~')) {
                  secret.file = expandHomeDir(secret.file)
                }

                fs.copyFileSync(path.resolve(secret.file), path.join(deployPath, '00-' + path.basename(secret.file)))
              }
            }
          }

          // console.log(JSON.stringify(config, null, 2))
          recursive(templatesDirectory, (err, files) => {
            files = _.sortBy(files, e => path.basename(e))
            for (let file of files) {
              if (!config.iios.app.registry.configData && path.basename(file).match(/regcred/)) {
                console.log('warning: skip ergistry credentials because is empty')
                continue
              }
              let data = fs.readFileSync(file, 'utf8')
              let docs = YAML.parseAllDocuments(data)
              let result = ''
              for (let doc of docs) {
                try {
                  doc = updateRefs(doc, config)
                  // console.log(YAML.stringify(doc))
                  result = result + '\n---\n' + YAML.stringify(doc)
                } catch (err) {
                  console.log('\n' + path.basename(file) + ' -> error. skip file\n')
                }
              }

              console.log(path.basename(file) + ' generated')
              fs.writeFileSync(path.join(deployPath, path.basename(file)), result, 'utf8')
            }

            console.log('\ndone')
          })
          break
        default:
          console.error('[' + action + '] action not available (<action> = get|generate)')
          process.exit(1)
      }
    })
}
