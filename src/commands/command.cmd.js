const cli = require('commander')
const fs = require('fs-extra')
const path = require('path')
const txtRed = require('../utils').txtRed
const txtOrange = require('../utils').txtOrange

module.exports = function(config) {
  cli
    .command('command <action> <name>')
    .description('CLI tool commands management\
      \n\t\t\t\t\t<create> botstrap command source code \
      \n\t\t\t\t\t<add> add command to IIO CLI tool \
      \n\t\t\t\t\t<remove> remove command from IIO CLI tool')
    .option('-d, --dest <path>', 'set destination directory path for creation command (default: ./<name>)')
    .option('-s, --src <path>', 'set source directory path for add command (default: ./<name>)')
    .action(function(action, name, options) {
      switch (action) {
        case 'create':
          try {
            options.dest = options.dest || name
            let destPath = path.resolve(process.cwd(), options.dest)
            if (fs.existsSync(destPath)) {
              console.error(txtRed('error: destination directory already exists'))
              process.exit(1)
            }
            fs.mkdirSync(destPath)
            let dest = path.join(destPath, name + '.cmd.js')
            fs.copyFileSync(path.join(__dirname, '../../config/template/template.cmd.js'),
              dest)

            console.log('command creation done.')
          } catch (err) {
            console.error('failed to create command plugin', err)
          }
          break
        case 'add':
          try {
            options.src = options.src || name
            let srcPath = path.resolve(process.cwd(), options.src, name + '.cmd.js')
            if (!fs.existsSync(srcPath)) {
              console.error('command name does not much local file')
              process.exit(1)
            }
            fs.copyFileSync(srcPath, path.join(__dirname, name + '.cmd.js'))
            console.log('done')
          } catch (err) {
            console.error('failed to add command plugin', err)
          }
          break
        case 'remove':
          try {
            let fullpath = path.join(__dirname, name + '.cmd.js')
            fs.unlinkSync(fullpath)
            console.log('done')
          } catch (err) {
            console.error('error: command does not exist')
          }
          break
        default:
          console.error('action not accepted')
      }
    })
}
