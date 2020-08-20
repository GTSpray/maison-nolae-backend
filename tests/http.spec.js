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

const getRandomInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

const randomStringNumber = () => [...'xxxxx'].map(() => getRandomInt(0, 9)).join('')

const server = (fakeUrl) =>
  new Promise((resolve) => {
    const url = new URL(fakeUrl)
    const spies = {
      headers: jest.fn(),
      body: jest.fn(),
      response: jest.fn(),
      req: jest.fn()
    }

    const fakeApp = express()
      .use(bodyParser.urlencoded({ extended: true }))
      .use((req, res) => {
        spies.headers(req.headers)
        spies.body(req.body)
        spies.response(req, res)
        spies.req({
          method: req.method,
          originalUrl: req.originalUrl
        })
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
    const response = await request(url)
    expect(response.status).toBe(200)
    expect(response.data).toStrictEqual({
      message: 'Hello Wrold!'
    })
  })

  it('get /contracts should return list of contracts', async () => {
    const response = await request(`${url}/contracts`)
    expect(response.status).toBe(200)
    expect(response.data).toStrictEqual(contracts)
  })

  it('get /player should return list of players', async () => {
    const response = await request(`${url}/players`)
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

    afterAll((done) => {
      fakeServer.server.close(done)
    })

    let options, mockUser, mockToken
    beforeEach(() => {
      jest.clearAllMocks()
      options = {
        method: 'POST',
        data: {
          code: randomStringNumber()
        }
      }
      mockUser = {
        username: 'johnnyKnoxville',
        discriminator: randomStringNumber()
      }
      mockToken = {
        access_token: randomStringNumber(),
        token_type: 'Bearer',
        expires_in: 604800,
        refresh_token: randomStringNumber(),
        scope: 'identify,guilds'
      }
    })

    describe('when a user from server come', () => {
      let response
      beforeEach(async () => {
        fakeServer.spies.response
          .mockImplementationOnce((_req, res) => {
            res.status(200).json(mockToken)
          })
          .mockImplementationOnce((_req, res) =>
            res.status(200).json(mockUser)
          )
          .mockImplementationOnce((_req, res) =>
            res
              .status(200)
              .json([
                { id: 'another' },
                { id: process.env.oauth_discord_id_server_discord }
              ])
          )

        response = await request(`${url}/auth`, options)
      })

      it('should call /oauth2/token for getting user 0Auth token', async () => {
        expect(fakeServer.spies.req).toHaveBeenNthCalledWith(1, {
          method: 'POST',
          originalUrl: '/oauth2/token'
        })
        expect(fakeServer.spies.body).toHaveBeenNthCalledWith(1, {
          client_id: process.env.oauth_discord_client_id,
          client_secret: process.env.oauth_discord_client_secret,
          grant_type: 'authorization_code',
          redirect_uri: process.env.oauth_discord_redirect_uri,
          code: options.data.code.toString(),
          scope: 'identify,guilds'
        })
        expect(fakeServer.spies.headers).toHaveBeenNthCalledWith(1, {
          accept: '*/*',
          'accept-encoding': expect.anything(),
          connection: expect.anything(),
          'content-length': expect.anything(),
          'content-type': 'application/x-www-form-urlencoded',
          host: `${fakeServer.url.hostname}:${fakeServer.url.port}`,
          'user-agent': expect.anything()
        })
      })

      it('should call /@me for getting user name and discriminator', async () => {
        expect(fakeServer.spies.req).toHaveBeenNthCalledWith(2, {
          method: 'GET',
          originalUrl: '/users/@me'
        })
        expect(fakeServer.spies.headers).toHaveBeenNthCalledWith(2, {
          accept: '*/*',
          'accept-encoding': expect.anything(),
          authorization: `${mockToken.token_type} ${mockToken.access_token}`,
          connection: expect.anything(),
          host: `${fakeServer.url.hostname}:${fakeServer.url.port}`,
          'user-agent': expect.anything()
        })
        expect(fakeServer.spies.body).toHaveBeenNthCalledWith(2, {})
      })

      it('should call /@me/guilds for getting user servers', async () => {
        expect(fakeServer.spies.req).toHaveBeenNthCalledWith(3, {
          method: 'GET',
          originalUrl: '/users/@me/guilds'
        })
        expect(fakeServer.spies.headers).toHaveBeenNthCalledWith(3, {
          accept: '*/*',
          'accept-encoding': expect.anything(),
          authorization: `${mockToken.token_type} ${mockToken.access_token}`,
          connection: expect.anything(),
          host: `${fakeServer.url.hostname}:${fakeServer.url.port}`,
          'user-agent': expect.anything()
        })
        expect(fakeServer.spies.body).toHaveBeenNthCalledWith(3, {})
      })

      it('should respond 200 return user jwt when all step are done', async () => {
        expect(response.status).toBe(200)
        expect(response.data).toEqual({
          player: {
            id: expect.anything(),
            pseudo: mockUser.username,
            x: 0,
            y: 0
          },
          token: expect.anything()
        })
        expect(response.data.token).toMatchJWT({
          id: response.data.player.id,
          pseudo: `${mockUser.username}#${mockUser.discriminator}`
        })
      })
    })

    describe('when some trouble come with user', () => {
      it('should respond 401 when /oauth2/token respond 401', async () => {
        fakeServer.spies.response
          .mockImplementationOnce((_req, res) => {
            res.status(401).send()
          })

        const response = await request(`${url}/auth`, options)

        expect(fakeServer.spies.response).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(401)
        expect(response.data).toStrictEqual({
          message: 'discord fail'
        })
      })

      it('should not call @me and @me/guilds when /oauth2/token fail', async () => {
        fakeServer.spies.response
          .mockImplementation((_req, res) => {
            res.status(500).send()
          })

        const response = await request(`${url}/auth`, options)

        expect(fakeServer.spies.response).toHaveBeenCalledTimes(1)
        expect(fakeServer.spies.req).toHaveBeenCalledWith({
          method: 'POST',
          originalUrl: '/oauth2/token'
        })
        expect(response.status).toBe(401)
        expect(response.data).toStrictEqual({
          message: 'discord fail'
        })
      })

      it('should respond 401 when /@me respond 401', async () => {
        fakeServer.spies.response
          .mockImplementationOnce((_req, res) => {
            res.status(200).json(mockToken)
          })
          .mockImplementationOnce((_req, res) =>
            res.status(401).send()
          )
          .mockImplementationOnce((_req, res) =>
            res
              .status(200)
              .json([
                { id: 'another' },
                { id: process.env.oauth_discord_id_server_discord }
              ])
          )

        const response = await request(`${url}/auth`, options)

        expect(fakeServer.spies.response).toHaveBeenCalledTimes(3)
        expect(fakeServer.spies.req).toHaveBeenNthCalledWith(2, {
          method: 'GET',
          originalUrl: '/users/@me'
        })
        expect(response.status).toBe(401)
        expect(response.data).toStrictEqual({
          message: 'discord fail'
        })
      })

      it('should respond 403 when /@me/guilds do not return oauth_discord_id_server_discord (so user is not in server)', async () => {
        fakeServer.spies.response
          .mockImplementationOnce((_req, res) => {
            res.status(200).json(mockToken)
          })
          .mockImplementationOnce((_req, res) =>
            res.status(200).json(mockUser)
          )
          .mockImplementationOnce((_req, res) =>
            res.status(200).json([{ id: 'anotherone' }, { id: 'bitedadust' }])
          )

        const response = await request(`${url}/auth`, options)

        expect(fakeServer.spies.response).toHaveBeenCalledTimes(3)
        expect(response.status).toBe(403)
        expect(response.data).toStrictEqual({
          message: 'forbidden'
        })
      })

      it('should respond 401 when /@me/guilds respond 401', async () => {
        fakeServer.spies.response
          .mockImplementationOnce((_req, res) => {
            res.status(200).json(mockToken)
          })
          .mockImplementationOnce((_req, res) =>
            res.status(200).json(mockUser)
          )
          .mockImplementationOnce((_req, res) =>
            res
              .status(401)
              .send()
          )

        const response = await request(`${url}/auth`, options)

        expect(fakeServer.spies.response).toHaveBeenCalledTimes(3)
        expect(response.status).toBe(401)
        expect(response.data).toStrictEqual({
          message: 'discord fail'
        })
      })
    })
  })
})
