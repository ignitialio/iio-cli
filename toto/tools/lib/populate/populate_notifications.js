const fs = require('fs')
const _ = require('lodash')

const path = require('path')
const collectionName = path.basename(__filename).replace('populate_', '').replace('js', '')

let status = [
  "noack",
  "ack"
]

let levels = [
  "spam",
  "info",
  "warn",
  "alert",
  "critical"
]

let template = {
  "message": "Changement d'équipe au centre d'information passagers",
  "user": "gcrood",
  "link": "",
  "level": "info",
  "status": "noack",
  "image": "assets/"
}


exports.populate = async (db, resetOnly) => {
  let users = db.collection('users')
  let usersList = await users.find({}).toArray()

  let notifications = db.collection('notifications')

  try {
    await notifications.deleteMany({}) // reset
    console.log('...notifications reset')
  } catch (err) {
    console.log(err)
  }

  if (resetOnly) return

  try {
    for (let i = 0; i < 5; i++) {
      let obj = _.cloneDeep(template)

      user = usersList[Math.floor(Math.random()*usersList.length)]

      if (user.username !== 'tcrood') {
        obj.user = user.username

        obj.status = status[Math.floor(Math.random()*status.length)]
        obj.level = levels[Math.floor(Math.random()*levels.length)]
        obj.image = 'assets/icons/' + obj.level + '.png'

        await notifications.insertOne(obj, { w: 1})
      }
    }
  } catch (err) {
    console.log(err)
  }

  console.log('...notifications done')
}
