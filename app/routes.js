const {getJson} = require('simple-fetch')
const DEFAULT_PLAYLIST_SCHEMA = {
  enum: ['custom'],
  enumNames: {
    custom: 'Choose a playlist from a URI...'
  }
}

const DEFAULT_ARTIST_SCHEMA = {
  enum: ['custom'],
  enumNames: {
    custom: 'Choose an artist from a URI...'
  }
}

module.exports = function setRoutes (app) {
  // Primary OAuth request handler.
  // This handler fetches the user's Spotify playlists and followed artists,
  // then populates an install field with the entries.
  app.post('/', function (request, response) {
    const {install} = request.body
    if (!request.body.metadata.newValue) {
      // User has logged out. Reset schema.

      Object.assign(install.schema.properties.widgets.items.properties.playlist.properties.URI, DEFAULT_PLAYLIST_SCHEMA)

      install.options.widgets.forEach(widget => {
        widget.playlist.URI = 'custom'
      })

      Object.assign(install.schema.properties.widgets.items.properties.artist.properties.URI, DEFAULT_ARTIST_SCHEMA)

      install.options.widgets.forEach(widget => {
        widget.artist.URI = 'custom'
      })

      response.json({install, proceed: true})
      return
    }

    const auth = request.body.authentications.account.token

    getJson('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        authorization: `${auth.type} ${auth.token}`
      }
    })
      .catch(error => {
        response.json({
          proceed: false,
          errors: [{type: '400', message: error.toString()}]
        })
      })
      .then(res => {
        const {items = []} = res

        const playlistSchema = Object.assign({}, DEFAULT_PLAYLIST_SCHEMA)

        items.forEach(item => {
          const key = ['spotify', item.owner.type, item.owner.id, item.type, item.id].join(':')
          playlistSchema.enum.push(key)
          playlistSchema.enumNames[key] = item.name
        })

        Object.assign(install.schema.properties.widgets.items.properties.playlist.properties.URI, playlistSchema)

        install.options.widgets.forEach(widget => {
          widget.playlist.URI = playlistSchema.enum[1]
        })

        // Include link to Spotify Analytics Dashboard.
        install.links = [{
          title: 'Spotify',
          description: 'Visit Spotify to manage your playlists.',
          href: 'https://www.spotify.com'
        }]

        response.json({install, proceed: true})
      })
  })

  // Account metadata handler.
  // This handler fetches user info and populates the login entry with user's email address.
  app.get('/account-metadata', function (request, response) {
    getJson('https://api.spotify.com/v1/me', {
      headers: {
        authorization: request.headers.authorization
      }
    })
      .catch(error => {
        response.json({
          proceed: false,
          errors: [{type: '400', message: error.toString()}]
        })
      })
      .then(res => {
        response.json({
          metadata: {
            email: res.email,
            username: res.display_name || res.id,
            userId: res.id
          }
        })
      })
  })

  app.get('/healthcheck', function (request, response) {
    response.sendStatus(200)
  })
}
