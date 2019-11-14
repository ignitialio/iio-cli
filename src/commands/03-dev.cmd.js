const cli = require('commander')
const fs = require('fs')
const path = require('path')
const exec = require('child_process').execSync
const txtRed = require('../utils').txtRed
const txtOrange = require('../utils').txtOrange

module.exports = function(config) {
  cli
    .command('dev <action> [what]')
    .description('manage dev local cluster ([what]=infra) \
      \n\t\t\t\t\t<deploy> deploy Docker containers \
      \n\t\t\t\t\t<remove> remove Docker containers')
    .option('-s, --sentinel', 'redis sentinel enabled')
    .action(function(action, what, options) {
      if (what === 'infra' || !what) {
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

        if (action === 'remove') {
          console.log(txtOrange('removing infra services (redis, mongo, minio)...'))

          if (options.sentinel) {
            try {
              exec('docker stack rm infra')
            } catch (err) {
              console.error(txtRed('error: have you initialized a stack ?...'))
              process.exit(1)
            }

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
              console.error(txtRed('error: have you installed docker-compose ?...'))
            }

            try {
              exec('docker network rm infra')
            } catch (err) {
              console.error(txtRed('failed to remove network'))
              process.exit(1)
            }
          }
        } else if (action === 'deploy') {
          console.log(txtOrange('start infra (redis, mongo, minio) for dev purposes...'))

          if (options.sentinel) {
            try {
              exec('docker network create --driver overlay infra_sentinel')
            } catch (err) {
              console.log(txtOrange('network exists already'))
            }

            try {
              exec('docker stack deploy --compose-file ' + composeFilePath + ' infra')
            } catch (err) {
              console.error(txtRed('error: have you initialized a docker swarm ?...'))
              process.exit(1)
            }
          } else {
            try {
              exec('docker network create infra')
            } catch (err) {
              console.log('network exists already')
            }

            try {
              exec('docker-compose -f ' + composeFilePath + ' up -d')
            } catch (err) {
              console.error(txtRed('error: have you installed docker-compose ?...'))
              process.exit(1)
            }
          }
        } else {
          console.log(txtOrange('action [%s] not available'), action)
        }
      } else {
        console.error(txtRed('not yet implemented'))
      }

      console.log(txtOrange('infra deploy done.'))
    }).on('--help', function() {
      console.log('')
      console.log('Examples:')
      console.log('');
      console.log('  $ iio infra dev')
    })
}
