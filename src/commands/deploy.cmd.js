const cli = require('commander')

const deploy = require('../helpers/deploy')
const populate = require('../helpers/populate')
const txtRed = require('../utils').txtRed

module.exports = function(config) {
  // deploy
  cli
    .command('deploy')
    .description('deploy IIO app or service from Git local repository to an existing cluster' + txtRed('[DEPRECATED]'))
    .option('-w, --workingDir <path>', 'set working directory path (default=.')
    .option('-o, --orchestrator <type>', 'set orchestrator type (k8s|swarm), default=k8s')
    .option('-i, --ingress <inressType>', 'set ingress type (nginx|traefik, default=nginx)')
    .action(function(options) {
      deploy('deploy', options)
    })

  // remove
  cli
    .command('remove')
    .description('remove IIO app or service from an existing cluster based on local Git repository' + txtRed('[DEPRECATED]'))
    .option('-w, --workingDir <path>', 'set working directory path (default=.')
    .option('-o, --orchestrator <type>', 'set orchestrator type (k8s|swarm), default=k8s')
    .option('-i, --ingress <inressType>', 'set ingress type (nginx|traefik, default=nginx)')
    .action(function(options) {
      deploy('remove', options)
    })

  // populate
  cli
    .command('populate')
    .description('populate IIO app databases based on local Git repository' + txtRed('[DEPRECATED]'))
    .option('-w, --workingDir <path>', 'set working directory path (default=.')
    .action(function(options) {
      populate(options)
    })
}
