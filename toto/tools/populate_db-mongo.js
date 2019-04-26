#!/usr/bin/env node

const MongoClient = require('mongodb').MongoClient

const users = require('./lib/populate/populate_users.js').populate
const roles = require('./lib/populate/populate_roles.js').populate
const notifications = require('./lib/populate/populate_notifications.js').populate

async function saveVersion(db) {
  let metas = db.collection('metas')
  let version = process.env.IGNITIALIO_DATAVERSION || new Date().toISOString().substring(0,10)
  version = version.substring(0,4) + version.substring(5,7) + version.substring(8,10)
  let rev = 1
  let current = await metas.findOne({ name: 'dataVersion'})
  if (current) {
    rev = current.rev + 1
  }

  console.log('--> version', version)
  await metas.updateOne({ name: 'dataVersion' }, {
    $set: {
      value: version,
      rev: rev
    }
  }, { upsert: true })
  console.log('-> version stamped')
}

async function run() {
  try {
    let resetOnly = false // set only if necessary
    let url
    if (process.env.MONGODB_USER &&
      process.env.MONGODB_PASSWORD &&
      process.env.MONGODB_OPTIONS &&
      process.env.MONGODB_URI &&
      process.env.MONGODB_DBNAME) {
      url = 'mongodb+srv://' + process.env.MONGODB_USER + ':' +
        process.env.MONGODB_PASSWORD + '@' + process.env.MONGODB_URI + '/' +
        process.env.MONGODB_DBNAME + '?' + process.env.MONGODB_OPTIONS
    } else {
      url = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:40000') +
        '/' + (process.env.MONGODB_DBNAME || 'toto') +
        (process.env.MONGODB_OPTIONS ? '?' + process.env.MONGODB_OPTIONS : '')
    }

    console.log('connecting to ' + url + '...')
    let client = await MongoClient.connect(url, { useNewUrlParser: true })

    let db = client.db()
    await roles(db, resetOnly)
    await users(db, resetOnly)
    await notifications(db, resetOnly)
    await saveVersion(db)
    console.log('done')
    client.close()
  } catch (err) {
    console.log('error connecting to db', err)
  }
}

if (require.main === module) {
  run()
}

module.exports = run
