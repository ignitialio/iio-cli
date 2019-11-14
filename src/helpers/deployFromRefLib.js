const fs = require('fs-extra')
const path = require('path')
const got = require('got')
const _ = require('lodash')

module.exports = function(config, action, name, options) {
  let token
  try {
    token = fs.readFileSync(path.join(config.iioFolderPath, '.token'), 'utf8')
    token = JSON.parse(token).token
  } catch (err) {
    console.error(err, txtRed('failed to load token'))
    process.exit(1)
  }


  let url = config.apps.referenceLib.endpoint + '/api/item'
  // testing only
  if (_.findIndex(process.argv, e => e.match('src/index.js'))) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
  }

  got(url, {
    method: 'get',
    json: true,
    body: {
      token: token
    }
  }).then(answer => {
    if (!answer.body.err) {
      console.log(answer.body)
      console.log('deploy done.')
    } else {
      console.error(txtRed(answer.body.err))
    }
    // console.log(answer.body)
  }).catch(err => {
    console.error(err, txtRed('failed to deploy from reference library'))
  })
}
