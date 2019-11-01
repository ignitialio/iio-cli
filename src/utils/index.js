const fs = require('fs-extra')
const path = require('path')
const listDirectories = require('list-directories')
const chalk = require('chalk')
const rimraf = require('rimraf')

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

exports.txtRed = function(txt) {
  return chalk.rgb(255, 0, 0)(txt) // red text
}

exports.txtOrange = function(txt) {
  return chalk.rgb(255, 165, 0)(txt) // orange text
}
