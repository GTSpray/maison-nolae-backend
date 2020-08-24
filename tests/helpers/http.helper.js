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
  const mockUser = {
    username: 'randomUser' + randomStringNumber(5),
    discriminator: randomStringNumber(4)
  }
  const mockToken = {
    access_token: randomStringNumber(10),
    token_type: 'Bearer',
    expires_in: 604800,
    refresh_token: randomStringNumber(10),
    scope: 'identify,guilds'
  }

  oAuthS.response.mockClear()
  oAuthS.response
    .mockImplementationOnce((_req, res) => {
      res.status(200).json(mockToken)
    })
    .mockImplementationOnce((_req, res) => res.status(200).json(mockUser))
    .mockImplementationOnce((_req, res) =>
      res
        .status(200)
        .json([
          { id: process.env.oauth_discord_id_server_discord }
        ])
    )
  const response = await axios.post(url, {
    code: randomStringNumber()
  })
  return response.data
}
