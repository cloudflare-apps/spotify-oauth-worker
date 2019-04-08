"use strict";
/**
 * @typedef Item
 * @property {string} uri
 * @property {string} name
 */

/**
 * Constants
 */
const DEFAULT_PLAYLIST_SCHEMA = {
  enum: ["custom"],
  enumNames: {
    custom: "Choose a playlist from a URI..."
  }
};

const DEFAULT_ARTIST_SCHEMA = {
  enum: ["custom"],
  enumNames: {
    custom: "Choose an artist from a URI..."
  }
};

/**
 * Worker HTTP logic
 */
addEventListener("fetch", event => {
  return event.respondWith(
    handleRequest(event.request)
      .then(resp => resp)
      .catch(error => {
        return new Response(
          JSON.stringify({
            proceed: false,
            errors: [{ type: "400", message: error.message }]
          })
        );
      })
  );
});

/**
 * Set Node routing logic e.g. app.get(..)
 * to Worker routing logic e.g. if(url..)new Response(..)
 * @param {Request} request
 */
async function handleRequest(request) {
  const app = {
    /**
     * @param {string} endpoint
     * @param {(req: Request) => Response|Promise<Response>} fn
     * @return {Promise<Response>|Response|null}
     */
    get: (endpoint, fn) => {
      const url = new URL(request.url);
      if (
        (url.pathname == "/spotify" || url.pathname == "/spotify/") &&
        request.method === "GET"
      )
        return fn(request);
      if (url.pathname.endsWith(endpoint) && request.method === "GET")
        return fn(request);
      return null;
    },
    /**
     * @param {string} endpoint
     * @param {(req: Request) => Response|Promise<Response>} fn
     * @return {Promise<Response>|Response|null}
     */
    post: (endpoint, fn) => {
      const url = new URL(request.url);
      if (
        (url.pathname == "/spotify" || url.pathname == "/spotify/") &&
        request.method === "POST"
      )
        return fn(request);

      if (url.pathname.endsWith(endpoint) && request.method === "POST")
        return fn(request);
      return null;
    }
  };
  // ret is the return path the request hits
  let ret = null;

  /**
   * Primary OAuth request handler.
   * This handler fetches the user's Spotify playlists and followed artists,
   * then populates an install field with the entries.
   */
  ret = app.post("/", async request => {
    const body = await request.json();
    const { install } = body;

    if (!body.metadata.newValue) {
      // User has logged out. Reset schema.

      Object.assign(
        install.schema.properties.widgets.items.properties.playlist.properties
          .URI,
        DEFAULT_PLAYLIST_SCHEMA
      );

      install.options.widgets.forEach(widget => {
        widget.playlist.URI = "custom";
      });

      Object.assign(
        install.schema.properties.widgets.items.properties.artist.properties
          .URI,
        DEFAULT_ARTIST_SCHEMA
      );

      install.options.widgets.forEach(widget => {
        widget.artist.URI = "custom";
      });
      return new Response(JSON.stringify({ install, proceed: true }));
    }
    let auth = "";
    try {
      auth = body.authentications.account.token;
    } catch (error) {
      return new Response(
        JSON.stringify({
          proceed: false,
          errors: [{ type: error.name, message: error.message }]
        })
      );
    }

    // Include link to Spotify player.
    install.links = [
      {
        title: "Spotify",
        description:
          "Visit Spotify to manage your playlists and followed artists.",
        href: "https://www.spotify.com"
      }
    ];
    const playlistsPromise = await fetch(
      "https://api.spotify.com/v1/me/playlists?limit=50",
      {
        headers: {
          authorization: `${auth.type} ${auth.token}`
        }
      }
    )
      .then(res => {
        return res.json();
      })
      .then(res => {
        /** @type {{items:Item[]}} */
        const { items = [] } = res;
        const playlistSchema = Object.assign({}, DEFAULT_PLAYLIST_SCHEMA);

        items.sort((a, b) => a.name.localeCompare(b.name));

        items.forEach(item => {
          playlistSchema.enum.push(item.uri);
          playlistSchema.enumNames[item.uri] = item.name;
        });
        Object.assign(
          install.schema.properties.widgets.items.properties.playlist.properties
            .URI,
          playlistSchema
        );
        install.options.widgets.forEach(widget => {
          widget.playlist.URI = playlistSchema.enum[1];
        });
      });

    const artistsPromise = fetch(
      "https://api.spotify.com/v1/me/following?type=artist&limit=50",
      {
        headers: {
          authorization: `${auth.type} ${auth.token}`
        }
      }
    )
      .then(res => res.json())
      .then(res => {
        /** @type {{items:Item[]}} */
        const { items = [] } = res.artists;
        const artistSchema = Object.assign({}, DEFAULT_ARTIST_SCHEMA);

        items.sort((a, b) => a.name.localeCompare(b.name));

        items.forEach(item => {
          artistSchema.enum.push(item.uri);
          artistSchema.enumNames[item.uri] = item.name;
        });
        Object.assign(
          install.schema.properties.widgets.items.properties.artist.properties
            .URI,
          artistSchema
        );

        install.options.widgets.forEach(widget => {
          widget.artist.URI = artistSchema.enum[1];
        });
      });

    ret = await Promise.all([playlistsPromise, artistsPromise])
      .catch(error => {
        return new Response(
          JSON.stringify({
            proceed: false,
            errors: [{ type: "400", message: error.toString() }]
          })
        );
      })
      .then(() => {
        return new Response(JSON.stringify({ install, proceed: true }));
      });
    return ret;
  });
  if (ret) {
    return ret;
  }
  /**
   * Account metadata handler.
   * This handler fetches user info and populates the login entry with user's info.
   */
  ret = app.get("/account-metadata", async request => {
    return fetch("https://api.spotify.com/v1/me", {
      headers: {
        authorization: request.headers.get("authorization")
      }
    })
      .catch(error => {
        return new Response(
          JSON.stringify({
            proceed: false,
            errors: [{ type: "400", message: error.toString() }]
          })
        );
      })
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          return new Response(
            JSON.stringify({
              proceed: false,
              errors: [{ type: "400", message: JSON.stringify(res.error) }]
            })
          );
        }
        return new Response(
          JSON.stringify({
            metadata: {
              email: res.email,
              username: res.display_name || res.id,
              userId: res.id
            }
          })
        );
      });
  });
  if (ret) {
    return ret;
  }
  ret = app.get("/healthcheck", request => {
    return new Response(null, { status: 200 });
  });
  if (ret) {
    return ret;
  }

  return new Response(
    JSON.stringify({
      proceed: false,
      errors: [
        {
          type: "route-not-found",
          message: "route not defined on worker " + request.url
        }
      ]
    })
  );
}
