const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios').default
const { randomStringNumber } = require('./random.helper')

module.exports.request = async (url, options) => {
  let response
  try {
    response = await axios.request(url, options)
  } catch (error) {
    if (error.response) {
      response = error.response
    } else {
      throw error
    }
  }
  return response
}

module.exports.server = (fakeUrl) =>
  new Promise((resolve) => {
    const url = new URL(fakeUrl)
    const response = jest.fn()
    const request = jest.fn()

    const fakeApp = express()
      .use(bodyParser.urlencoded({ extended: true }))
      .use((req, res) => {
        const bleh = (({ method, query, originalUrl, headers, body }) => ({
          method,
          originalUrl,
          headers,
          body,
          query
        }))(req)
        request(bleh)
        response(req, res)
      })

    const server = fakeApp.listen(url.port, () => {
      resolve({
        destroy: () => new Promise((resolve) => server.close(resolve)),
        url,
        response,
        request
      })
    })
  })

module.exports.randomAuth = async (oAuthS, url) => {
  const mockEndPoint = {
    'oauth2/token': {
      access_token: randomStringNumber(10),
      token_type: 'Bearer',
      expires_in: 604800,
      refresh_token: randomStringNumber(10),
      scope: 'identify,guilds'
    },
    'users/@me': {
      id: randomStringNumber(18),
      username: 'randomUser' + randomStringNumber(5),
      avatar: randomStringNumber(32),
      discriminator: randomStringNumber(4),
      public_flags: 0,
      flags: 0,
      locale: 'en',
      mfa_enabled: false
    },
    'users/@me/guilds': [
      {
        id: randomStringNumber(18),
        name: `randomServer ${randomStringNumber(5)}`,
        icon: randomStringNumber(32),
        owner: false,
        permissions: parseInt('1' + randomStringNumber(8), 10),
        features: ['ANIMATED_ICON', 'INVITE_SPLASH'],
        permissions_new: parseInt('1' + randomStringNumber(8), 10)
      },
      {
        id: process.env.oauth_discord_id_server_discord,
        name: `Server ${randomStringNumber(5)}`,
        icon: randomStringNumber(32),
        owner: false,
        permissions: '1' + randomStringNumber(8),
        features: ['ANIMATED_ICON', 'INVITE_SPLASH'],
        permissions_new: '1' + randomStringNumber(8)
      }
    ]
  }

  oAuthS.response.mockClear()
  oAuthS.response
    .mockImplementationOnce((_req, res) => res.json(mockEndPoint['oauth2/token']))
    .mockImplementationOnce((_req, res) => res.json(mockEndPoint['users/@me']))
    .mockImplementationOnce((_req, res) => res.json(mockEndPoint['users/@me/guilds']))

  const response = await axios.post(url, {
    code: randomStringNumber()
  })

  return response.data
}
