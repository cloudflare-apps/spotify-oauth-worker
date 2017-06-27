const createApp = require('./create-app')

const app = createApp({
  credentials: {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  },
  middlewares: [],
  port: parseInt(process.env.PORT, 10)
})

app.listen(app.get('port'), () => {
  console.log('Cloudflare Spotify is running on port', app.get('port'))
})
