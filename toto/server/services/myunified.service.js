const Service = require('@ignitial/iio-app-server').Service

class MyUnified extends Service {
  constructor(io, options) {
    super(io, {
      name: 'myunified',
      ...options
    })

    this._register()
  }

  myServiceMethod(args) {
    return new Promise((resolve, reject) => {
      resolve('it worked ! ' + this._options.someConfiguration)
    })
  }

  myProtectedServiceMethod(args) {
    return new Promise((resolve, reject) => {
      resolve('it worked ! ' + this._options.someConfiguration)
    })
  }
}

module.exports = MyUnified
