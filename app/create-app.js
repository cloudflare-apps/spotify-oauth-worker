const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const setRoutes = require('./routes')

app.use(bodyParser.json())

module.exports = function createApp (options) {
  app.set('clientID', options.credentials.clientID)
  app.set('clientSecret', options.credentials.clientSecret)
  app.set('port', options.port)

  const {middlewares = []} = options

  middlewares.forEach(middleware => app.use(middleware))

  setRoutes(app)

  return app
}
