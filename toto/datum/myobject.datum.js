const Item = require('../lib/core/item').Item
const pino = require('../lib/utils').pino

/*
 * {
 *   name: ''
 *   somedata: ''
 * }
 */
class MyObject extends Item {
  constructor(options) {
    options.name = 'myobjects'
    super(options)

    this.ready().then(() => {
      this.createIndex({
        index: { 'name': 1 },
        options: { unique: true }
      }).catch(err => {
        pino.error(err, 'failed to create index for ' + this._name)
      })
    }).catch(err => pino.error(err, 'failed to create collection ' + this._name))
  }
}

exports.MyObject = MyObject
