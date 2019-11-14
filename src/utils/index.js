const fs = require('fs-extra')
const path = require('path')
const listDirectories = require('list-directories')
const chalk = require('chalk')
const rimraf = require('rimraf')
const YAML = require('yaml')
const jp = require('jsonpath')
const _ = require('lodash')
const expandHomeDir = require('expand-home-dir')
const recursive = require('recursive-readdir')

exports.recursive = function(folder) {
  return new Promise((resolve, reject) => {
    recursive(folder, (err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(files)
      }
    })
  })
}

let updateElement = function(which, data, appPackageDef, configDirectory) {
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

let updateRefs = function(config, data, appPackageDef, configDirectory) {
  data = data || config
  if (typeof config === 'object') {
    for (let prop in config) {
      if (typeof config[prop] === 'string') {
        let ref = config[prop].match(/\{\{(.*?)\}\}/g)
        if (ref) {
          //
          config[prop] = updateElement(config[prop], data, appPackageDef, configDirectory)
          //config[prop] = ref[1] + jp.query(data, ref[2])[0]
        }
      } else {
        if (typeof config[prop] === 'object') {
          config[prop] = updateRefs(config[prop], data, appPackageDef, configDirectory)
        }
      }
    }
  } else {
    if (typeof config === 'string') {
      let ref = config.match(/\{\{(.*?)\}\}/g)
      if (ref) {
        config[prop] = updateElement(config[prop], data, appPackageDef, configDirectory)
        //config = ref[1] + jp.query(data, ref[2])[0]
      }
    }
  }

  return config
}

exports.updateRefs = updateRefs

exports.rimraf = function(path) {
  return new Promise((resolve, reject) => {
    rimraf(path, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

exports.cleanupAndExit = function(loweredName, servicePath) {
  console.log('creation of service ' + loweredName + ' error')
  if (servicePath && fs.existsSync(servicePath)) {
    console.log('deleting directory', servicePath)
    fs.removeSync(servicePath)
  }
  process.exit(1)
}

exports.renameDirs = async function (dirPath, loweredName, servicePath) {
  if (path.basename(dirPath).match('.git')) return
  servicePath = servicePath || dirPath
  if (path.basename(dirPath).match('iiost')) {
    let oldDirPath = dirPath
    dirPath = path.join(path.dirname(oldDirPath), loweredName)
    if (fs.existsSync(dirPath)) {
      console.log('cannot recreate existing directory', dirPath,
      '\ntry giving your service a different name.')
      exports.cleanupAndExit(loweredName, servicePath)
    }
    fs.moveSync(oldDirPath, dirPath)
  }
  let childDirPaths = await listDirectories(dirPath)
  for (let childDirPath of childDirPaths.values()) {
    await exports.renameDirs(childDirPath, loweredName, servicePath)
  }
}

let txtRed = function(txt) {
  return chalk.rgb(255, 0, 0)(txt) // red text
}

exports.txtRed = txtRed

let txtOrange = function(txt) {
  return chalk.rgb(255, 165, 0)(txt) // orange text
}

exports.txtOrange = txtOrange
