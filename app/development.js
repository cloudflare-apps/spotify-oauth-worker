const credentials = require('../credentials.json')
const createApp = require('./create-app')

const app = createApp({
  credentials: {
    clientID: credentials.clientID,
    clientSecret: credentials.clientSecret
  },
  port: 5000
})

app.listen(app.get('port'), () => {
  console.log('Cloudflare Spotify is running on port', app.get('port'))
})
