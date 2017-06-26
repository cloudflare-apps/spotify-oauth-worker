# Spotify OAuth Express

This is a Express service that fetches a user's Spotify playlists for
the [Spotify](https://github.com/CloudflareApps/Spotify) app.

## Local Setup

### Requirements

- Node 6.3.1+
- Cloudflare account
- Spotify account

Fill in your credentials in _credentials.json_ from the
[Spotify Developer Dashboard](https://developer.spotify.com/my-applications)

### Usage

- `npm install`
- `npm start`

## Cloudflare Service Configuration

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
