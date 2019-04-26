const cli = require('commander')
const fs = require('fs')
const path = require('path')
const exec = require('child_process').execSync

module.exports = function(config) {
  cli
    .command('infra <mode>')
    .description('deploys redis, mongo and minio infrastructure (<mode> = dev|prod)')
    .option('-k, --kubeconfig <path>', 'kubectl configuration file path to access Kubernetes cluster')
    .option('-r, --rm', 'remove deployment')
    .option('-s, --sentinel', 'redis sentinel enabled')
    .action(function(mode, options) {
      if (mode === 'dev') {
        let infraPath = path.join(config.iioFolderPath, 'infra')
        let minioPath = path.join(infraPath, 'minio')
        let minioConfigPath = path.join(minioPath, 'config')
        let minioDataPath = path.join(minioPath, 'data')
        let minioConfigFilePath = path.join(minioConfigPath, 'config.json')
        let mongoPath = path.join(infraPath, 'mongo')

        if (!fs.existsSync(minioPath)) {
          fs.mkdirSync(minioPath, { recursive: true })
        }

        if (!fs.existsSync(minioConfigPath)) {
          fs.mkdirSync(minioConfigPath, { recursive: true })
        }

        if (!fs.existsSync(minioDataPath)) {
          fs.mkdirSync(minioDataPath, { recursive: true })
        }

        if (!fs.existsSync(minioConfigFilePath)) {
          fs.copyFileSync(path.join(__dirname, '../../config/infra/minio/config.json'), minioConfigFilePath)
        }

        if (!fs.existsSync(mongoPath)) {
          fs.mkdirSync(mongoPath, { recursive: true })
        }

        let composeFilePath = path.join(__dirname, '../../config/infra/docker-compose' +
          (options.sentinel ? '-sentinel' : '') + '.yml')

        if (options.rm) {
          console.log('remove infra services (redis, mongo, minio)...')

          console.log('try to remove services...')

          if (options.sentinel) {
            try {
              exec('docker stack rm infra')
            } catch (err) {
              console.error('failed: have you initialized a stack ?...', err)
              process.exit(1)
            }

            console.log('try to remove network...')
            try {
              exec('docker network rm infra_sentinel')
            } catch (err) {
              console.error('failed to remove network', err)
              process.exit(1)
            }
          } else {
            try {
              exec('docker-compose -f ' + composeFilePath + ' stop')
              exec('docker-compose -f ' + composeFilePath + ' rm -f')
            } catch (err) {
              console.error('failed: have you installed docker-compose ?...', err)
            }

            console.log('try to remove network...')
            try {
              exec('docker network rm infra')
            } catch (err) {
              console.error('failed to remove network', err)
              process.exit(1)
            }
          }
        } else {
          console.log('start infra (redis, mongo, minio) for dev purposes...')

          if (options.sentinel) {
            console.log('try to create infra_sentinel docker overlay network...')
            try {
              exec('docker network create --driver overlay infra_sentinel')
            } catch (err) {
              console.log('network exists already')
            }

            try {
              exec('docker stack deploy --compose-file ' + composeFilePath + ' infra')
            } catch (err) {
              console.error('failed: have you initialized a docker swarm ?...', err)
              process.exit(1)
            }
          } else {
            console.log('try to create infra docker bridge network...')
            try {
              exec('docker network create infra')
            } catch (err) {
              console.log('network exists already')
            }

            try {
              exec('docker-compose -f ' + composeFilePath + ' up -d')
            } catch (err) {
              console.error('failed: have you installed docker-compose ?...', err)
              process.exit(1)
            }
          }
        }
      } else {
        console.log('not yet implemented')
      }

      console.log('done')
    }).on('--help', function() {
      console.log('')
      console.log('Examples:')
      console.log('');
      console.log('  $ iio infra dev')
      console.log('  $ iio infra --kubeconfig /home/toto/k8s/mycluster/amd64.conf prod')
    })
}
