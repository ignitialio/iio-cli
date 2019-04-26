exports.cleanupAndExit = function(loweredName, servicePath) {
  console.log('creation of service ' + loweredName + ' failed')
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
