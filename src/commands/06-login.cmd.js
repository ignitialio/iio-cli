const cli = require('commander')
const fs = require('fs-extra')
const path = require('path')
const readlineSync = require('readline-sync')
const YAML = require('yaml')
const got = require('got')
const FormData = require('form-data')
const _ = require('lodash')

const txtOrange = require('../utils').txtOrange
const txtRed = require('../utils').txtRed

module.exports = function(config) {
  cli
    .command('login <username>')
    .description('login to reference library')
    .option('-e, --endpoint <path>', 'set reference library new endpoiont before login')
    .action(function(username, options) {
      let pwd = readlineSync.question('Enter password: ', {
        hideEchoBack: true
      })

      if (options.endpoint) {
        config.apps.referenceLib.endpoint = options.endpoint
        fs.writeFileSync(config.configFilePath, YAML.stringify(config.apps), 'utf8')

        console.log(txtOrange(
          'iio configuration has been updated with new reference library endpoint [' +
          options.endpoint + ']'))
      }

      let url = config.apps.referenceLib.endpoint + '/api/login'

      // testing only
      if (_.findIndex(process.argv, e => e.match('src/index.js'))) {
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
      }

      // console.log(url)
      const form = new FormData()
      form.append('username', username)
      form.append('password', pwd)

      got(url, {
        method: 'post',
        body: form
      }).then(answer => {
        try {
          fs.writeFileSync(path.join(config.iioFolderPath, '.token'), answer.body, 'utf8')
        } catch (err) {
          console.error(err, txtRed('failed to save token'))
        }
        // console.log(answer.body)
      }).catch(err => {
        console.error(err, txtRed('failed to login'))
      })
    })
}
