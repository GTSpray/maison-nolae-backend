const contracts = require('../src/contract')
const { server, request, randomAuth } = require('./helpers/http.helper')
const { randomStringNumber } = require('./helpers/random.helper')

describe('TI HTTP Server', () => {
  const httpUrl = `http://localhost:${process.env.PORT}`

  it.concurrent('get / should return hello world', async () => {
    const response = await request(httpUrl)
    expect(response.status).toBe(200)
    expect(response.data).toStrictEqual({
      message: 'Hello Wrold!'
    })
  })

  it.concurrent('get /contracts should return list of contracts', async () => {
    const response = await request(`${httpUrl}/contracts`)
    expect(response.status).toBe(200)
    expect(response.data).toStrictEqual(contracts)
  })

  describe('/players', () => {
    let oAuthS

    beforeAll(async () => {
      oAuthS = await server(process.env.oauth_discord_base_url)
    })

    afterAll(async () => {
      await oAuthS.destroy()
    })

    let mockUser
    beforeEach(async () => {
      mockUser = []

      for (let i = 0; i < 6; i++) {
        const auth = await randomAuth(oAuthS, `${httpUrl}/auth`)
        mockUser.push(auth.player)
      }
    })

    it('get /players should return list of players', async () => {
      const response = await request(`${httpUrl}/players`)
      expect(response.status).toBe(200)
      expect(response.data).toEqual(expect.arrayContaining(mockUser))
    })
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

    it.concurrent(`${method} ${path} should add headers to prevent CORS failure`, async () => {
      const response = await request(`${httpUrl}${path}`, { method })
      expect(response.headers).toEqual(expect.objectContaining(corsHeaders))
    })

    it.concurrent(`get ${path} should add headers to prevent CORS failure`, async () => {
      const response = await request(`${httpUrl}${path}`, { method: 'OPTIONS' })
      expect(response.status).toBe(200)
      expect(response.headers).toEqual(expect.objectContaining(corsHeaders))
    })
  })

  describe('/auth', () => {
    let oAuthS

    beforeAll(async () => {
      oAuthS = await server(process.env.oauth_discord_base_url)
    })

    afterAll(async () => {
      await oAuthS.destroy()
    })

    let options, mockUser, mockToken
    beforeEach(() => {
      options = {
        method: 'POST',
        data: {
          code: randomStringNumber(10)
        }
      }
      mockUser = {
        username: 'johnnyKnoxville',
        discriminator: randomStringNumber(4)
      }
      mockToken = {
        access_token: randomStringNumber(10),
        token_type: 'Bearer',
        expires_in: 604800,
        refresh_token: randomStringNumber(10),
        scope: 'identify,guilds'
      }
    })

    describe('when a user from server come', () => {
      let response
      beforeEach(async () => {
        oAuthS.response
          .mockImplementationOnce((_req, res) => {
            res.status(200).json(mockToken)
          })
          .mockImplementationOnce((_req, res) => res.status(200).json(mockUser))
          .mockImplementationOnce((_req, res) =>
            res
              .status(200)
              .json([
                { id: 'another' },
                { id: process.env.oauth_discord_id_server_discord }
              ])
          )

        response = await request(`${httpUrl}/auth`, options)
      })

      it('should call /oauth2/token for getting user 0Auth token', async () => {
        expect(oAuthS.request).toHaveBeenNthCalledWith(1, {
          method: 'POST',
          originalUrl: '/oauth2/token',
          headers: {
            accept: '*/*',
            'accept-encoding': expect.anything(),
            connection: expect.anything(),
            'content-length': expect.anything(),
            'content-type': 'application/x-www-form-urlencoded',
            host: `${oAuthS.url.hostname}:${oAuthS.url.port}`,
            'user-agent': expect.anything()
          },
          query: {},
          body: {
            client_id: process.env.oauth_discord_client_id,
            client_secret: process.env.oauth_discord_client_secret,
            grant_type: 'authorization_code',
            redirect_uri: process.env.oauth_discord_redirect_uri,
            code: options.data.code.toString(),
            scope: 'identify,guilds'
          }
        })
      })

      it('should call /@me for getting user name and discriminator', async () => {
        expect(oAuthS.request).toHaveBeenNthCalledWith(2, {
          method: 'GET',
          originalUrl: '/users/@me',
          headers: {
            accept: '*/*',
            'accept-encoding': expect.anything(),
            authorization: `${mockToken.token_type} ${mockToken.access_token}`,
            connection: expect.anything(),
            host: `${oAuthS.url.hostname}:${oAuthS.url.port}`,
            'user-agent': expect.anything()
          },
          query: {},
          body: {}
        })
      })

      it('should call /@me/guilds for getting user servers', async () => {
        expect(oAuthS.request).toHaveBeenNthCalledWith(3, {
          method: 'GET',
          originalUrl: '/users/@me/guilds',
          headers: {
            accept: '*/*',
            'accept-encoding': expect.anything(),
            authorization: `${mockToken.token_type} ${mockToken.access_token}`,
            connection: expect.anything(),
            host: `${oAuthS.url.hostname}:${oAuthS.url.port}`,
            'user-agent': expect.anything()
          },
          query: {},
          body: {}
        })
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

      it('should get same id for same user', async () => {
        expect(response.status).toBe(200)
        oAuthS.response
          .mockImplementationOnce((_req, res) => {
            res.status(200).json(mockToken)
          })
          .mockImplementationOnce((_req, res) => res.status(200).json(mockUser))
          .mockImplementationOnce((_req, res) =>
            res
              .status(200)
              .json([
                { id: 'another' },
                { id: process.env.oauth_discord_id_server_discord }
              ])
          )

        const anotherAuth = await request(`${httpUrl}/auth`, options)

        expect(anotherAuth.status).toBe(200)
        expect(anotherAuth.data.token).toMatchJWT({
          id: response.data.player.id,
          pseudo: `${mockUser.username}#${mockUser.discriminator}`
        })
      })
    })

    describe('when some trouble come with user', () => {
      it('should respond 401 when /oauth2/token respond 401', async () => {
        oAuthS.response.mockImplementationOnce((_req, res) => {
          res.status(401).send()
        })

        const response = await request(`${httpUrl}/auth`, options)

        expect(oAuthS.response).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(401)
        expect(response.data).toStrictEqual({
          message: 'discord fail'
        })
      })

      it('should not call @me and @me/guilds when /oauth2/token fail', async () => {
        oAuthS.response.mockImplementation((_req, res) => {
          res.status(500).send()
        })

        const response = await request(`${httpUrl}/auth`, options)

        expect(oAuthS.response).toHaveBeenCalledTimes(1)
        expect(oAuthS.request).toHaveBeenCalledWith({
          method: 'POST',
          originalUrl: '/oauth2/token',
          headers: expect.anything(),
          query: expect.anything(),
          body: expect.anything()
        })
        expect(response.status).toBe(401)
        expect(response.data).toStrictEqual({
          message: 'discord fail'
        })
      })

      it('should respond 401 when /@me respond 401', async () => {
        oAuthS.response
          .mockImplementationOnce((_req, res) => {
            res.status(200).json(mockToken)
          })
          .mockImplementationOnce((_req, res) => res.status(401).send())
          .mockImplementationOnce((_req, res) =>
            res
              .status(200)
              .json([
                { id: 'another' },
                { id: process.env.oauth_discord_id_server_discord }
              ])
          )

        const response = await request(`${httpUrl}/auth`, options)

        expect(oAuthS.response).toHaveBeenCalledTimes(3)
        expect(oAuthS.request).toHaveBeenCalledWith({
          method: 'GET',
          originalUrl: '/users/@me',
          headers: expect.anything(),
          query: expect.anything(),
          body: expect.anything()
        })
        expect(response.status).toBe(401)
        expect(response.data).toStrictEqual({
          message: 'discord fail'
        })
      })

      it('should respond 403 when /@me/guilds do not return oauth_discord_id_server_discord (so user is not in server)', async () => {
        oAuthS.response
          .mockImplementationOnce((_req, res) => {
            res.status(200).json(mockToken)
          })
          .mockImplementationOnce((_req, res) => res.status(200).json(mockUser))
          .mockImplementationOnce((_req, res) =>
            res.status(200).json([{ id: 'anotherone' }, { id: 'bitedadust' }])
          )

        const response = await request(`${httpUrl}/auth`, options)

        expect(oAuthS.response).toHaveBeenCalledTimes(3)
        expect(oAuthS.request).toHaveBeenCalledWith({
          method: 'GET',
          originalUrl: '/users/@me/guilds',
          headers: expect.anything(),
          query: expect.anything(),
          body: expect.anything()
        })
        expect(response.status).toBe(403)
        expect(response.data).toStrictEqual({
          message: 'forbidden'
        })
      })

      it('should respond 401 when /@me/guilds respond 401', async () => {
        oAuthS.response
          .mockImplementationOnce((_req, res) => {
            res.status(200).json(mockToken)
          })
          .mockImplementationOnce((_req, res) => res.status(200).json(mockUser))
          .mockImplementationOnce((_req, res) => res.status(401).send())

        const response = await request(`${httpUrl}/auth`, options)

        expect(oAuthS.response).toHaveBeenCalledTimes(3)
        expect(oAuthS.request).toHaveBeenCalledWith({
          method: 'GET',
          originalUrl: '/users/@me/guilds',
          headers: expect.anything(),
          query: expect.anything(),
          body: expect.anything()
        })
        expect(response.status).toBe(401)
        expect(response.data).toStrictEqual({
          message: 'discord fail'
        })
      })
    })
  })
})
