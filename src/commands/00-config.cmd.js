const cli = require('commander')
const configHelper = require('../helpers/config')

module.exports = function(config) {
  cli
    .command('config <target> <action>')
    .description('manage (<action>=get|generate) \
      \n\t\t\t\t\t<app> application configuration \
      \n\t\t\t\t\t<deploy> deploy configuration \
      \n\t\t\t\t\t<data> data configuration')
    .option('-w, --workingDir <path>', 'set working directory path (default=.)')
    .option('-j, --jsonpath <query>', 'used with <get> action: returns only queried defined property from configuration')
    .option('-i, --input <path>', 'input configuration directory path')
    .option('-o, --output <path>', 'output directory path for application generated configuration')
    .option('-e, --env', 'use env templates for deploy config generation')
    .action(configHelper)
}
