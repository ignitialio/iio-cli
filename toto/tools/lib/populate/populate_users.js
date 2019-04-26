const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const _ = require('lodash')

let salt = bcrypt.genSaltSync(10)
let hash = bcrypt.hashSync('toto13!', salt)

let additionalUsers = require('../../data/users')

let template = {
  "username": "gcrood",
  "firstname": "Grug",
  "lastname": "Crood",
  "password": hash,
  "avatar": '',
  "role": 'admin',
  "lang": 'fr-FR',
  "contactInfo": {
    "email": "gcrood@google.com",
    "phone": {
      "mobile": "",
      "office": ""
    }
  },
  "settings": {
    "notificationsByEmail": false
  }
}

exports.populate = async db => {
  let users = db.collection('users')

  await users.deleteMany({}) // reset

  // insert admin
  await users.insertOne(_.cloneDeep(template), { w: 1 })

  for (let user of additionalUsers) {
    await users.insertOne(_.cloneDeep(user), { w: 1 })
  }

  if (process.env.STRESS_TEST) {
    let firstnames = JSON.parse(fs.readFileSync(path.join(process.cwd(),
      'tools/data/prenoms.json'), 'utf8'))
    let secondnames = JSON.parse(fs.readFileSync(path.join(process.cwd(),
      'tools/data/patronymes.json'), 'utf8'))

    for (let i = 0; i < 1000; i++) {
      try {
        let obj = _.cloneDeep(template)

        let rawFirstname = firstnames[Math.floor(Math.random()*firstnames.length)]
        obj.firstname = rawFirstname.fields.prenoms

        let secondname = secondnames[Math.floor(Math.random()*secondnames.length)]

        obj.lastname = secondname.slice(0, 1) + secondname.slice(1).toLowerCase().replace(' - ', '-')
        obj.username = obj.firstname.slice(0, 1).toLowerCase()
          + _.camelCase(secondname).toLowerCase()

        obj.contactInfo.email = obj.username + '@systra.fr'
        obj.contactInfo.phone.mobile = '+33 (0)6 12 34 56 78'
        obj.contactInfo.phone.office = '+33 (0)1 12 34 56 78'

        let gender = rawFirstname.fields.sexe === 'F' ? 'women' : 'men'
        obj.avatar = 'https://randomuser.me/api/portraits/med/' + gender + '/'
          + Math.floor(Math.random()*100)+ '.jpg'

        let rec = await users.insertOne(obj, { w: 1 })
      } catch(err) {
        // do nothing since checked
        // console.log(err)
        // process.exit(1);
      }
    }
  }

  console.log('...users done')
}
