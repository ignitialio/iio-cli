const fs = require('fs')
const path = require('path')

const Module = require('@ignitial/iio-app-server').Module

class AddOn extends Module {
  constructor(options) {
    super(options)
  }

  /* */
  myAddOnMethod() {
    return new Promise((resolve, reject) => {
      resolve('it worked !')
    })
  }
}

module.exports = AddOn
