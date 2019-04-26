const cli = require('commander')
const fs = require('fs-extra')
const path = require('path')
const exec = require('child_process').execSync
const git = require('simple-git')()
const replace = require('replace')
const rimraf = require('rimraf')
const recursive = require('recursive-readdir')
const listDirectories = require('list-directories')

module.exports = function(config) {
  // repalace with your own code
  cli
    .command('command <action> <name>')
    .description('create command from template to <path>, add or remove commands from <path> (<action> = create|add|remove) ')
    .option('-d, --dest <path>', 'set destination directory path for creation command (default: ./<name>)')
    .option('-s, --src <path>', 'set source directory path for add command (default: ./<name>)')
    .action(function(action, name, options) {
      console.log('done')
    })

  //
}
