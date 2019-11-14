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
const txtRed = require('../utils').txtRed
const txtOrange = require('../utils').txtOrange

let appPackageDef
let workingDirectory
let configDirectory

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
        } else if (typeof alt === 'number') {
          if (which !== '{{' + m + '}}') {
            result = result.replace('{{' + m + '}}', alt)
          } else {
            result = alt
          }
        } else {
          result = alt
        }
        break
      case 'packageJSON':
        result = which.replace('{{' + m + '}}', jp.query(appPackageDef, m.replace('packageJSON', '$'))[0])
        break
      default:
        if (m.match(/filedata\((.*?)\)/)) {
          let url = m.match(/filedata\((.*?)\)/)[1]
          let encoding = m.match(/(.*?)filedata/)[1]
          try {
            if (url.match('~')) {
              url = expandHomeDir(url)
            }
            let content = fs.readFileSync(url)
            // console.log(content.toString('base64'))
            result = which.replace('{{' + m + '}}', content.toString(encoding))
          } catch (err) {
            console.error(txtRed('config file [' + url + '] is missing'))
            process.exit(1)
          }
        } else if (m.match(/str\((.*?)\)/)) {
          let query = m.match(/str\((.*?)\)/)[1]

          let alt = jp.query(data, query)[0]
          if (!alt) {
            console.log('warning: json query [' + m + '] returned "undefined". will be replaced with empty string')
            alt = ''
          }

          if (typeof alt === 'string') {
            result = result.replace('{{' + m + '}}', '' + alt)
          } else if (typeof alt === 'number') {
            if (which !== '{{' + m + '}}') {
              result = result.replace('{{' + m + '}}', '' + alt)
            } else {
              result = '' + alt
            }
          } else {
            result = '' + alt
          }
        } else if (m.match(/yamlfile\((.*?)\)/)) {
          let url = path.resolve(configDirectory, m.match(/yamlfile\((.*?)\)/)[1])
          try {
            if (url.match('~')) {
              url = expandHomeDir(url)
            }
            result = YAML.parse(fs.readFileSync(url, 'utf8'))
          } catch (err) {
            console.error(txtRed('config file [' + url +
              '] is missing or bad format'), err)
            process.exit(1)
          }
        } else if (m.match(/env\((.*?)\)/)) {
          let envVar = m.match(/env\((.*?)\)/)[1]
          console.log(txtOrange('detected env var [' + envVar +
            ']: will be computed on runtime'))
            result = 'env(' + envVar + ')'
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
    .description('manage (<action>=get|generate) \
      \n\t\t\t\t\t<app> application configuration \
      \n\t\t\t\t\t<deploy> deploy configuration \
      \n\t\t\t\t\t<data> data configuration')
    .option('-w, --workingDir <path>', 'set working directory path (default=.')
    .option('-j, --jsonpath <query>', 'used with <get> action: returns only queried defined property from configuration')
    .option('-i, --input <path>', 'input configuration directory path')
    .option('-o, --output <path>', 'output directory path for application generated configuration')
    .option('-e, --env', 'use env templates for deploy config generation')
    .action(function(target, action, options) {
      workingDirectory = path.resolve('.')
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

      if (options.input) {
        configDirectory = path.resolve(workingDirectory, options.input)
      }

      switch (target) {
        case 'app':
          configDirectory = configDirectory || path.join(workingDirectory, 'config')
          configFile = path.join(configDirectory, 'app.yaml')
          break
        case 'deploy':
          configDirectory = configDirectory || path.join(workingDirectory, 'k8s', 'config')
          configFile = path.join(configDirectory, 'deploy.yaml')
          break
        case 'data':
          configDirectory = configDirectory || path.join(workingDirectory, 'k8s', 'config')
          configFile = path.join(configDirectory, 'deploy.yaml')
          break
        default:
          console.error(txtRed('[' + target + '] target not available (<target> = app|deploy|data)'))
          process.exit(1)
      }

      if (!fs.existsSync(configFile)) {
        console.error(txtRed('config file [' + configFile + '] is missing'))
        process.exit(1)
      }

      try {
        config = fs.readFileSync(configFile, 'utf8')
        config = YAML.parse(config)
        config = updateRefs(config)
      } catch (err) {
        console.error(txtRed('error when processing [' + target + '] config'), err)
      }

      switch (action) {
        case 'get':
          if (target === 'data') {
            console.log('data configuration cannot not be displayed for security reasons')
            process.exit(0)
          }

          if (options.jsonpath) {
            try {
              console.log(jp.query(config, options.jsonpath))
            } catch (err) {
              console.error(txtRed('failed to get jsonpath'))
            }
          } else {
            console.log(JSON.stringify(config, null, 2))
          }

          console.log('config display done.')
          break
        case 'generate':
          if (target === 'app') {
            try {
              let destinationPath
              if (options.output) {
                destinationPath = path.resolve(workingDirectory, options.output)
              } else {
                destinationPath = path.join(workingDirectory, 'server', 'config', 'generated')
              }

              if (!fs.existsSync(destinationPath)) {
                fs.mkdirSync(destinationPath)
              }

              let generatedData = JSON.stringify(config, null, 2)
              fs.writeFileSync(path.join(destinationPath, 'config.json'), generatedData, 'utf8')
            } catch (err) {
              console.error(txtRed('failed to generate app data'))
            }
          } else {
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

              switch (config.cluster.ingress) {
                case 'traefik':
                  files = _.filter(files, e => {
                    return !path.basename(e).match(/nginx/)
                  })
                  break
                case 'nginx':
                  files = _.filter(files, e => {
                    return !path.basename(e).match(/traefik/)
                  })
                  break
                default:
                  console.log('warning: [deploy.cluster.ingress] can only be nginx|traefik. set to nginx')
                  files = _.filter(files, e => {
                    return !path.basename(e).match(/traefik/)
                  })
              }

              for (let file of files) {
                if (!config.iios.app.registry.configData && path.basename(file).match(/regcred/)) {
                  console.log('warning: skip registry credentials because data is empty')
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

                switch (target) {
                  case 'deploy':
                    // avoid populate file
                    if (!path.basename(file).match(/populate/)) {
                      if (options.env) {
                        if (!path.basename(file).match(/app-deploy-configmap/)) {
                          fs.writeFileSync(path.join(deployPath, path.basename(file)), result, 'utf8')

                          console.log(path.basename(file) + ' generated')
                        }
                      } else {
                        if (!path.basename(file).match(/app-deploy-env/)) {
                          fs.writeFileSync(path.join(deployPath, path.basename(file)), result, 'utf8')

                          console.log(path.basename(file) + ' generated')
                        }
                      }
                    }
                    break
                  case 'data':
                    let filter = [ '00-app-secrets.yaml', '01-redis-pv.yaml', '02-redis-deploy.yaml', 'populate.yaml']
                    if (filter.indexOf(path.basename(file)) !== -1) {
                      fs.writeFileSync(path.join(deployPath, path.basename(file)), result, 'utf8')

                      console.log(path.basename(file) + ' generated')
                    }
                    break
                }
              }
            })
          }

          console.log('config generation done.')
          break
        default:
          console.error(txtRed('[' + action + '] action not available (<action> = get|generate)'))
          process.exit(1)
      }
    })
}
