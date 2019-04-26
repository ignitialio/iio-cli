const bcrypt = require('bcryptjs')

let salt = bcrypt.genSaltSync(10)
let hash = bcrypt.hashSync('13!toto', salt)

module.exports = [
  {
    "username": "tcrood",
    "firstname": "Thunk",
    "lastname": "Crood",
    "password": hash,
    "avatar": '',
    "role": 'user',
    'lang': 'fr-FR',
    "contactInfo": {
      "email": "vdrac@free.fr",
      "phone": {
        "mobile": "",
        "office": ""
      }
    },
    "settings": {
      "notificationsByEmail": false
    },
    _lastModified: new Date()
  }
]
