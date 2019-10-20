const cli = require('commander')
const fs = require('fs-extra')
const path = require('path')
const spawn = require('child_process').spawn

module.exports = function(config) {
  function proceed(action, options) {
    options.orchestrator = options.orchestrator || 'k8s'
    let npmDeployCmdTarget = 'deploy'
    let npmRemoveCmdTarget = 'remove'
    let workingDirectory = path.resolve('.')

    if (options.workingDir) {
      workingDirectory = path.resolve(options.workingDir)
    }

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

    if (options.kubeconfig) {
      process.env.IIOS_K8S_KUBECONFIG_PATH = options.kubeconfig
    }

    if (options.local) {
      npmDeployCmdTarget += ':minikube'
      npmRemoveCmdTarget += ':minikube'
    }

    if (options.domain) {
      process.env.IIOS_DEPLOY_DOMAIN = options.domain
    }

    if (options.letsencrypt) {
      process.env.IIOS_ENABLE_LETSENCRYPT = true
    }

    try {
      if (action === 'deploy') {
        let npm = spawn('npm', [ 'run', npmDeployCmdTarget ], {
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
      } else {
        let npm = spawn('npm', [ 'run', npmRemoveCmdTarget] , {
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
      }
    } catch (err) {
      console.error('failed to deploy', err)
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
    .option('-l, --local', 'set cluster target to local minikube')
    .option('-k, --kubeconfig <path>', 'kubeconfig file path (default=~/.kube/config)')
    .option('-d, --domain <domain>', 'domain to be used as app entry point (default=mini.kube)')
    .option('-l, --letsencrypt', 'activate letsencrypt for <domain> given by the --domain option (needs preconfigured domain DNS entry)')
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
    .option('-l, --local', 'set cluster target to local minikube')
    .option('-k, --kubeconfig <path>', 'kubeconfig file path (default=~/.kube/config)')
    .option('-d, --domain <domain>', 'domain to be used as app entry point (default=mini.kube)')
    .option('-l, --letsencrypt', 'activate letsencrypt for <domain> given by the --domain option (needs preconfigured domain DNS entry)')
    .action(function(options) {
      proceed('remove', options)
    })
}
