const redisCfg = require('./redis')

module.exports = {
  settings: {
    rpcTimeout: 10000,
    _unified: true
  },
  options: {
    apigateway: {
      namespace: process.env.IIOS_NAMESPACE || 'toto',
      redis: {
        sentinels: redisCfg.REDIS_SENTINELS,
        host: redisCfg.REDIS_HOST,
        port: redisCfg.REDIS_PORT,
        db: redisCfg.REDIS_DB
      }
    },
    myunified: {
      someConfiguration: 'that\'s all folks !'
    }
  }
}
