const fs = require('fs-extra')
const path = require('path')
const spawn = require('child_process').spawn
const YAML = require('yaml')
const expandHomeDir = require('expand-home-dir')
const txtRed = require('../utils').txtRed
const txtOrange = require('../utils').txtOrange

module.exports = function(action, options) {
  options.ingress = options.ingress || 'nginx'
  options.orchestrator = options.orchestrator || 'k8s'

  let npmDeployCmdTarget = 'deploy'
  let npmRemoveCmdTarget = 'remove'
  let workingDirectory = path.resolve('.')

  if (options.workingDir) {
    workingDirectory = path.resolve(options.workingDir)
  }

  let configFile = path.join(workingDirectory, 'k8s', 'config', 'deploy.yaml')
  let config

  try {
    config = fs.readFileSync(configFile, 'utf8')
    config = YAML.parse(config)

    if (config.cluster.kubeConfigPath.match('~')) {
      config.cluster.kubeConfigPath = expandHomeDir(config.cluster.kubeConfigPath)
    }
  } catch (err) {
    console.error('error when processing deploy config', err)
  }

  process.env.IIOS_K8S_KUBECONFIG_PATH = config.cluster.kubeConfigPath

  switch (options.orchestrator) {
    case 'k8s':
      npmDeployCmdTarget = 'k8s:' + npmDeployCmdTarget
      npmRemoveCmdTarget = 'k8s:' + npmRemoveCmdTarget
      break
    case 'swarm':
      npmDeployCmdTarget = 'swarm:' + npmDeployCmdTarget
      npmRemoveCmdTarget = 'swarm:' + npmRemoveCmdTarget
      break
    default:
      if (options.orchestrator && options.orchestrator !== '') {
        console.log(txtOrange('value [' + options.orchestrator + '] for option [orchestrator] is not available'))
      }
  }

  switch (options.ingress) {
    case 'nginx': break
    case 'traefik': process.env.IIOS_USE_TRAEFIK = true; break
    default:
      if (options.ingress && options.ingress !== '') {
        console.log(txtOrange('value [' + options.ingress + '] for option [ingress] is not available'))
      }
  }

  try {
    let npm
    switch (action) {
      case 'deploy':
        npm = spawn('npm', [ 'run', npmDeployCmdTarget ], {
          cwd: workingDirectory
        })

        npm.stdout.on('data', data => {
          console.log(data.toString().slice(0, -1))
        })

        npm.stderr.on('data', data => {
          console.error(data.toString().slice(0, -1))
        })

        npm.on('close', code => {
          console.log('deployment done.')
        })
        break
      case 'remove':
        npm = spawn('npm', [ 'run', npmRemoveCmdTarget] , {
          cwd: workingDirectory
        })

        npm.stdout.on('data', data => {
          console.log(data.toString().slice(0, -1))
        })

        npm.stderr.on('data', data => {
          console.error(data.toString().slice(0, -1))
        })

        npm.on('close', code => {
          console.log('removal done.')
        })
        break
    }
  } catch (err) {
    console.error(txtRed('error when deploying cluster'))
    process.exit(1)
  }
}
