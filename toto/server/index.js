const appserver = require('@ignitial/iio-app-server')
const IIOAppServer = appserver.IIOAppServer
const defaultModules = appserver.defaultModules
const defaultUnified = appserver.defaultUnified

const MyUnified = require('./services/myunified.service')
const MyAddOn = require('./modules/myaddon.module')

const config = require('./config')

let app = new IIOAppServer(config)

app.on('client', clientId => {
  for (let unifiedName in defaultUnified) {
    app.ws.addService(unifiedName, defaultUnified[unifiedName],
      config.unified.options[unifiedName], clientId)
  }

  app.ws.addService('myunified', MyUnified, config.unified.options.myunified, clientId)
})

for (let moduleName in defaultModules) {
  app.instantiateModule(moduleName, defaultModules[moduleName])
}

app.instantiateModule('myaddon', MyAddOn)
