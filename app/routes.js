const {getJson} = require('simple-fetch')
const {assign} = Object
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

      assign(
        install.schema.properties.widgets.items.properties.playlist.properties.URI,
        DEFAULT_PLAYLIST_SCHEMA
      )

      install.options.widgets.forEach(widget => {
        widget.playlist.URI = 'custom'
      })

      assign(
        install.schema.properties.widgets.items.properties.artist.properties.URI,
        DEFAULT_ARTIST_SCHEMA
      )

      install.options.widgets.forEach(widget => {
        widget.artist.URI = 'custom'
      })

      response.json({install, proceed: true})
      return
    }

    const auth = request.body.authentications.account.token

    // Include link to Spotify Analytics Dashboard.
    install.links = [{
      title: 'Spotify',
      description: 'Visit Spotify to manage your playlists and followed artists.',
      href: 'https://www.spotify.com'
    }]

    const playlistsPromise = getJson('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        authorization: `${auth.type} ${auth.token}`
      }
    })
      .then(res => {
        const {items = []} = res
        const playlistSchema = assign({}, DEFAULT_PLAYLIST_SCHEMA)

        items.sort((a, b) => a.name.localeCompare(b.name))

        items.forEach(item => {
          playlistSchema.enum.push(item.uri)
          playlistSchema.enumNames[item.uri] = item.name
        })

        assign(install.schema.properties.widgets.items.properties.playlist.properties.URI, playlistSchema)

        install.options.widgets.forEach(widget => {
          widget.playlist.URI = playlistSchema.enum[1]
        })
      })

    const artistsPromise = getJson('https://api.spotify.com/v1/me/following?type=artist&limit=50', {
      headers: {
        authorization: `${auth.type} ${auth.token}`
      }
    })
      .then(res => {
        const {items = []} = res.artists
        const artistSchema = assign({}, DEFAULT_ARTIST_SCHEMA)

        items.sort((a, b) => a.name.localeCompare(b.name))

        items.forEach(item => {
          artistSchema.enum.push(item.uri)
          artistSchema.enumNames[item.uri] = item.name
        })

        assign(install.schema.properties.widgets.items.properties.artist.properties.URI, artistSchema)

        install.options.widgets.forEach(widget => {
          widget.artist.URI = artistSchema.enum[1]
        })
      })

    Promise.all([playlistsPromise, artistsPromise])
      .catch(error => {
        response.json({
          proceed: false,
          errors: [{type: '400', message: error.toString()}]
        })
      })
      .then(() => {
        response.json({install, proceed: true})
      })
  })

  // Account metadata handler.
  // This handler fetches user info and populates the login entry with user's info.
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
