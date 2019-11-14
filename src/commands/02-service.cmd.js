const cli = require('commander')
const txtRed = require('../utils').txtRed
const txtOrange = require('../utils').txtOrange

const create = require('../helpers/create')
const deploy = require('../helpers/deploy')
const deployFromRefLib = require('../helpers/deployFromRefLib')
const publish = require('../helpers/publish')

module.exports = function(config) {
  cli
    .command('service <action> [name]')
    .description('manage services: \
      \n\t\t\t\t\t<create> from template \
      \n\t\t\t\t\t<deploy> to cluster \
      \n\t\t\t\t\t<remove> from cluster \
      \n\t\t\t\t\t<publish> to reference library')
    .option('-l, --lang <language>', 'set template\'s language: py, js (default: js)')
    .option('-p, --path <path>', 'set destination directory path when <create> (default=./<name>)')
    .option('-t, --tag <version_tag>', 'select specific version thanks to git tags when <create> (could be branch name as well)')
    .option('-w, --workingDir <path>', 'set working directory path when <publish>, <deploy>, <remove> from local repository (default=.)')
    .option('-o, --orchestrator <type>', 'set orchestrator type (k8s|swarm) when <deploy>, <remove> (default=k8s)')
    .option('-i, --ingress <inressType>', 'set ingress type when <deploy> (nginx|traefik, default=nginx)')
    .action(function(action, name, options) {
      switch (action) {
        case 'create':
          if (!name) {
            name = 'myApp'
            console.log(txtOrange('WARNING: missing [name], then default [myApp] used'))
          }
          create(config, 'service', name, options)
          break
        case 'deploy':
          if (name) {
            console.log('[name] provided, then deploy from reference library')
            deployFromRefLib(config, 'deploy', name, options)
          } else {
            console.log('deploy from local Git repository')
            deploy('deploy', options)
          }
          break
        case 'remove':
          if (name) {
            console.log('[name] provided, then remove by name')
            deployFromRefLib(config, 'remove', name, options)
          } else {
            console.log('remove using local Git repository receipes')
            deploy('remove', options)
          }
          break
        case 'publish':
          publish(config, options)
          break
        default:
          console.log('action [%s] is not available')
          process.exit(1)
      }
    })
}
