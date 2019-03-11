# Spotify OAuth Workers Client

This is a workers service that fetches a user's Spotify playlists for
the [Spotify](https://github.com/CloudflareApps/Spotify) app. Also sets metadata for the user

## Local Setup

### Requirements

- Cloudflare account
- Spotify account

### Usage

-  Save the contents of worker.js as a Cloudflare Worker

## Cloudflare Service Configuration
**Cloudflare completes the OAuth dance and then sends the token to this client service. Steps on how to get this token**

Fill in your credentials in _credentials.json_ from the
[Spotify Developer Dashboard](https://developer.spotify.com/my-applications)

After signing in with Cloudflare account,
[create a new service](https://www.cloudflare.com/apps/services/new) with the following configuration.

| Field                    | Value                                                                                |
|--------------------------|--------------------------------------------------------------------------------------|
| OAuth Authentication URL | https://accounts.spotify.com/authorize                                               |
| OAuth Client ID          | _via Spotify Developer Console_                                                      |
| OAuth Scope              | playlist-read-private, playlist-read-collaborative, user-follow-read user-read-email |
| OAuth Token URL          | https://accounts.spotify.com/api/token                                               |
| OAuth Client Secret      | _via Spotify Developer Console_                                                      |
| Metadata Endpoint        | https://yourservicedomain.com/account-metadata                                       |
