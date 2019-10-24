const cli = require('commander')
const fs = require('fs-extra')
const path = require('path')
const spawn = require('child_process').spawn
const YAML = require('yaml')
const expandHomeDir = require('expand-home-dir')

module.exports = function(config) {
  function proceed(action, options) {
    options.ingress = options.ingress || 'nginx'
    options.orchestrator = options.orchestrator || 'k8s'

    let npmDeployCmdTarget = 'deploy'
    let npmRemoveCmdTarget = 'remove'
    let npmPopulateCmdTarget = 'populate'
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
        npmPopulateCmdTarget = 'k8s:' + npmPopulateCmdTarget
        break
      case 'swarm':
        npmDeployCmdTarget = 'swarm:' + npmDeployCmdTarget
        npmRemoveCmdTarget = 'swarm:' + npmRemoveCmdTarget
        npmPopulateCmdTarget = 'swarm:' + npmPopulateCmdTarget
        break
      default:
        if (options.orchestrator && options.orchestrator !== '') {
          console.log('value [' + options.orchestrator + '] for option [orchestrator] is not available')
        }
    }

    switch (options.ingress) {
      case 'nginx': break
      case 'traefik': process.env.IIOS_USE_TRAEFIK = true; break
      default:
        if (options.ingress && options.ingress !== '') {
          console.log('value [' + options.ingress + '] for option [ingress] is not available')
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
            console.log('done with code ' + code);
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
            console.log('done with code ' + code);
          })
          break
        case 'populate':
          npm = spawn('npm', [ 'run', npmPopulateCmdTarget] , {
            cwd: workingDirectory
          })

          npm.stdout.on('data', data => {
            console.log(data.toString().slice(0, -1))
          })

          npm.stderr.on('data', data => {
            console.error(data.toString().slice(0, -1))
          })

          npm.on('close', code => {
            console.log('done with code ' + code);
          })
          break
      }
    } catch (err) {
      console.error('error when deploying cluster', err)
      process.exit(1)
    }
  }

  // deploy
  cli
    .command('deploy')
    .description('deploy IIO app or service to an existing cluster')
    .option('-w, --workingDir <path>', 'set working directory path (default=.')
    .option('-o, --orchestrator <type>', 'set orchestrator type (k8s|swarm), default=k8s')
    .option('-i, --ingress <inressType>', 'set ingress type (nginx|traefik, default=nginx)')
    .action(function(options) {
      proceed('deploy', options)
    })

  // remove
  cli
    .command('remove')
    .description('remove IIO app or service from an existing cluster')
    .option('-w, --workingDir <path>', 'set working directory path (default=.')
    .option('-o, --orchestrator <type>', 'set orchestrator type (k8s|swarm), default=k8s')
    .option('-i, --ingress <inressType>', 'set ingress type (nginx|traefik, default=nginx)')
    .action(function(options) {
      proceed('remove', options)
    })

  // populate
  cli
    .command('populate')
    .description('populate IIO app databases')
    .option('-w, --workingDir <path>', 'set working directory path (default=.')
    .action(function(options) {
      proceed('populate', options)
    })
}
