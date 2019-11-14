const fs = require('fs-extra')
const path = require('path')
const spawn = require('child_process').spawn
const YAML = require('yaml')
const jp = require('jsonpath')
const _ = require('lodash')
const expandHomeDir = require('expand-home-dir')
const rimraf = require('rimraf').sync

const utils = require('../utils')
const txtRed = utils.txtRed
const txtOrange = utils.txtOrange
const updateRefs = utils.updateRefs
const recursive = utils.recursive

/*
  target: app|deploy|data
  action: get|generate
*/
module.exports = async function(target, action, options) {
  let yamlContent = [] // used for publishing configuration
  let configDirectory
  let configFile
  let config
  let workingDirectory = path.resolve('.')

  if (options.workingDir) {
    workingDirectory = path.resolve(options.workingDir)
  }

  let templatesDirectory = path.join(workingDirectory, 'k8s', 'templates')
  let appPackageDef = JSON.parse(fs.readFileSync(path.join(workingDirectory, 'package.json'), 'utf8'))

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
    config = updateRefs(config, null, appPackageDef, configDirectory)
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
        try {
          let files = await recursive(templatesDirectory)
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
                doc = updateRefs(doc, config, appPackageDef, configDirectory)
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
                      // yamlContent is populated only for configmap config
                      yamlContent.push({
                        name: path.basename(file),
                        content: result
                      })
                      console.log(path.basename(file) + ' generated for configMap variant')
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
        } catch (err) {
          console.error('failed to read configuration', err)
          process.exit(1)
        }
      }

      console.log('config generation done.')
      break
    default:
      console.error(txtRed('[' + action + '] action not available (<action> = get|generate)'))
      process.exit(1)
  }

  return {
    yamlContent: yamlContent,
    packageDef: appPackageDef
  }
}
