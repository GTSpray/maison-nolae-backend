const axios = require('axios').default
const express = require('express')
const bodyParser = require('body-parser')
const contracts = require('../contract')
const request = async (url, options) => {
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

const server = (fakeUrl) => new Promise((resolve) => {
  const url = new URL(fakeUrl)
  const spies = {
    headers: jest.fn(),
    body: jest.fn(),
    response: jest.fn()
  }
  const fakeApp = express()
    .use(bodyParser.urlencoded({ extended: true }))
    .use((req, res) => {
      spies.headers(req.headers)
      spies.body(req.body)
      spies.response(req, res)
    })

  const server = fakeApp.listen(url.port, () => {
    resolve({
      url,
      spies,
      server
    })
  })
})

describe('HTTP Server', () => {
  const url = `http://localhost:${process.env.PORT}`

  it('get / should return hello world', async () => {
    const response = await axios.get(url)
    expect(response.status).toBe(200)
    expect(response.data).toStrictEqual({
      message: 'Hello Wrold!'
    })
  })

  it('get /contracts should return list of contracts', async () => {
    const response = await axios.get(`${url}/contracts`)
    expect(response.status).toBe(200)
    expect(response.data).toStrictEqual(contracts)
  })

  it('get /player should return list of players', async () => {
    const response = await axios.get(`${url}/players`)
    expect(response.status).toBe(200)
    expect(response.data).toStrictEqual([])
  });

  [
    ['/', 'GET'],
    ['/contracts', 'GET'],
    ['/players', 'GET'],
    ['/auth', 'POST']
  ].forEach(([path, method]) => {
    const corsHeaders = {
      'access-control-allow-origin': process.env.fronturl,
      'access-control-allow-methods': '*',
      'access-control-allow-headers': '*',
      'access-control-max-age': '1728000'
    }

    it(`${method} ${path} should add headers to prevent CORS failure`, async () => {
      const response = await request(`${url}${path}`, { method })
      expect(response.headers).toEqual(expect.objectContaining(corsHeaders))
    })

    it(`get ${path} should add headers to prevent CORS failure`, async () => {
      const response = await axios.options(`${url}${path}`)
      expect(response.status).toBe(200)
      expect(response.headers).toEqual(expect.objectContaining(corsHeaders))
    })
  })

  describe('/auth', () => {
    let fakeServer
    beforeAll(async () => {
      fakeServer = await server(process.env.oauth_discord_base_url)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    afterAll((done) => {
      fakeServer.server.close(done)
    })

    describe('should call discord oAuth service', () => {
      const options = {
        method: 'POST',
        data: {
          code: 12345
        }
      }

      it('for getting user token respond 401 discord authent fail', async () => {
        fakeServer.spies.response.mockImplementation((_req, res) => res.status(401).send())

        const response = await request(`${url}/auth`, options)
        expect(response.status).toBe(401)
        expect(response.data).toStrictEqual({
          message: 'discord fail'
        })

        expect(fakeServer.spies.response).toHaveBeenCalled()
        expect(fakeServer.spies.body).toHaveBeenCalledWith({
          client_id: process.env.oauth_discord_client_id,
          client_secret: process.env.oauth_discord_client_secret,
          grant_type: 'authorization_code',
          redirect_uri: process.env.oauth_discord_redirect_uri,
          code: options.data.code.toString(),
          scope: 'identify,guilds'
        })
        expect(fakeServer.spies.headers).toHaveBeenCalledWith({
          accept: '*/*',
          'accept-encoding': 'gzip,deflate',
          connection: 'close',
          'content-length': '184',
          'content-type': 'application/x-www-form-urlencoded',
          host: `${fakeServer.url.hostname}:${fakeServer.url.port}`,
          'user-agent': 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)'
        })
      })

      it('and return user jwt when all step are done', async () => {
        fakeServer.spies.response.mockImplementationOnce((_req, res) => {
          res.status(200).send({
            access_token: '6qrZcUqja7812RVdnEKjpzOL4CvHBFG',
            token_type: 'Bearer',
            expires_in: 604800,
            refresh_token: 'D43f5y0ahjqew82jZ4NViEr2YafMKhue',
            scope: 'identify,guilds'
          })
        })
          .mockImplementationOnce((_req, res) => res.status(200).send({
            username: 'Johnny Noxville',
            discriminator: '12345'
          }))
          .mockImplementationOnce((_req, res) => res.status(200).send(
            [
              { id: process.env.oauth_discord_id_server_discord }
            ]
          ))

        const response = await request(`${url}/auth`, options)
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('player')
        expect(response.data).toHaveProperty('token')
      })
    })
  })
})
