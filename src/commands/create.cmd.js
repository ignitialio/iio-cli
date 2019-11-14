const cli = require('commander')

const create = require('../helpers/create')
const txtRed = require('../utils').txtRed

module.exports = function(config) {
  cli
    .command('create <what> <name')
    .description('initialize new iio application or service project named <name> (<what> = app|service) ' + txtRed('[DEPRECATED]'))
    .option('-p, --path <path>', 'set destination directory path. defaults to ./<name>')
    .option('-l, --lang <language>', 'set programming language: py, js (default: js)')
    .option('-t, --tag <version_tag>', 'selects specific version thanks to git tags. Could be branch name as well')
    .action(function(what, name, options) {
      create(config, 'app', name, options)
    })
}
