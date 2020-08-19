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
    const spy = jest.fn()
    let fakeServer
    beforeAll((done) => {
      const oauthServerUrl = new URL(process.env.oauth_discord_base_url)
      const spyApp = express().use(bodyParser.urlencoded({ extended: true })).use(spy)
      fakeServer = spyApp.listen(oauthServerUrl.port, done)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    afterAll((done) => {
      fakeServer.close(done)
    })

    describe('should call discord oAuth service', () => {
      const options = {
        method: 'POST',
        data: {
          code: 12345
        }
      }

      it('for getting user token', async () => {
        const bodySpy = jest.fn()
        const headerSpy = jest.fn()

        spy.mockImplementation((req, res) => {
          bodySpy(req.body)
          headerSpy(req.headers)
          res.status(401).send()
        })
        const response = await request(`${url}/auth`, options)
        expect(response.status).toBe(401)
        expect(response.data).toStrictEqual({
          message: 'discord fail'
        })
        expect(spy).toHaveBeenCalled()
        expect(bodySpy).toHaveBeenCalledWith({
          client_id: process.env.oauth_discord_client_id,
          client_secret: process.env.oauth_discord_client_secret,
          grant_type: 'authorization_code',
          redirect_uri: process.env.oauth_discord_redirect_uri,
          code: options.data.code.toString(),
          scope: 'identify,guilds'
        })
        expect(headerSpy).toHaveBeenCalledWith({
          "accept": "*/*",
          "accept-encoding": "gzip,deflate",
          "connection": "close",
          "content-length": "184",
          "content-type": "application/x-www-form-urlencoded",
          "host": "localhost:1664",
          "user-agent": "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
        })
      })
    })
  })
})
