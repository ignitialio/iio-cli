const fs = require('fs-extra')
const path = require('path')
const got = require('got')
const _ = require('lodash')

const configHelper = require('../helpers/config')
const txtOrange = require('../utils').txtOrange
const txtRed = require('../utils').txtRed

/*
{
  "_id": null,
  "name": "laborum consectetur minim aute",
  "description": "aliqua irure",
  "icon": "in amet cillum consectetur ullamco",
  "tags": [
    "exercitation do consequat nostrud dolor",
    "proident",
    "irure ani",
    "sunt est"
  ],
  "receipes": [
    {
      "name": "culpa consectetur deserunt ut",
      "content": "commodo labore esse"
    },
    {
      "name": "ea velit quis ut",
      "content": "aliqua"
    },
    {
      "name": "laborum fugiat ipsum ex amet",
      "content": "sit ut tempor proident"
    }
  ],
  "publicationInfo": {
    "date": "officia dolor",
    "author": {
      "name": "ad labore dolor ullamco ut",
      "email": "adipisicing pariatur Excepteur ad tempor"
    },
    "ip": "sed consequat ad id"
  },
  "_lastModified": "sint labore"
}
*/
module.exports = async function(config, options) {
  let token
  try {
    token = fs.readFileSync(path.join(config.iioFolderPath, '.token'), 'utf8')
    token = JSON.parse(token).token
  } catch (err) {
    console.error(err, txtRed('failed to load token'))
    process.exit(1)
  }

  let workingDirectory = path.resolve('.')

  if (options.workingDir) {
    workingDirectory = path.resolve(options.workingDir)
  }

  let computedConfig = await configHelper('deploy', 'generate', options)

  // manage template case for testing
  let basename = computedConfig.packageDef.name === '@ignitial/iio-app-material-template' ?
    'ignitialio' : computedConfig.packageDef.name

  let iconPath = 'public/assets/' + basename + '-64.png'
  let iconBase64 = fs.readFileSync(path.join(workingDirectory, iconPath), 'base64')
  let ip = JSON.parse((await got('https://api.ipify.org?format=json')).body).ip
  let author = {
    name: '',
    email: ''
  }

  if (typeof computedConfig.packageDef.author === 'string') {
    author.name = computedConfig.packageDef.author.replace(/\<(.*?)\>/, '')
    author.email = computedConfig.packageDef.author.match(/\<(.*?)\>/)[1]
  }

  let record = {
    name: computedConfig.packageDef.name,
    description: computedConfig.packageDef.description,
    icon: iconBase64,
    tags: [],
    receipes: computedConfig.yamlContent,
    publicationInfo: {
      date: new Date(),
      author: author,
      ip: ip
    }
  }

  let url = config.apps.referenceLib.endpoint + '/api/publish'
  // testing only
  if (_.findIndex(process.argv, e => e.match('src/index.js'))) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
  }

  got(url, {
    method: 'post',
    json: true,
    body: {
      record: record,
      token: token
    }
  }).then(answer => {
    if (!answer.body.err) {
      console.log('publication done.')
    } else {
      console.error(txtRed(answer.body.err))
    }
    // console.log(answer.body)
  }).catch(err => {
    console.error(err, txtRed('failed to publish'))
  })

  // console.log(config.apps.referenceLib.endpoint)
  // console.log(record)
}
