const { socketResponse, wsClient, wsResponse, authWsClient } = require('./helpers/websocket.helper')
const { server, request } = require('./helpers/http.helper')
const { randomInt, randomStringNumber } = require('./helpers/random.helper')

describe('Websocket', () => {
  const wsUrl = `ws://localhost:${process.env.PORT}`
  const httpUrl = `http://localhost:${process.env.PORT}`

  it('should connect websockets', (done) => {
    expect.assertions(1)
    const ws = wsClient(wsUrl)
      .on('open', () => {
        expect(true).toBe(true)
        ws.close()
      })
      .on('close', () => done())
  })

  it('should not share ws sessions', async () => {
    expect.assertions(2)
    const spy = jest.fn()
    const ws = wsClient(wsUrl).on('message', spy)

    const response = await socketResponse(wsUrl, 'not json')
    ws.close()

    expect(spy).not.toHaveBeenCalled()
    expect(response).toBeDefined()
  })

  it('should respond invalid event when message is not event', async () => {
    const response = await socketResponse(wsUrl, {})
    expect(response).toStrictEqual({ error: 'invalid event' })
  })

  it('should respond invalid event when message is string', async () => {
    const response = await socketResponse(wsUrl, 'not json')
    expect(response).toStrictEqual({ error: 'invalid event' })
  })

  it('should respond invalid auth method when authentication.token is bad formated ', async () => {
    const response = await socketResponse(wsUrl, {
      type: 'authentication',
      payload: {
        token: 'badformated'
      }
    })
    expect(response).toStrictEqual({ error: 'Invalid auth method' })
  })

  it('should respond unable to get session when user use token from another platform', async () => {
    const response = await socketResponse(wsUrl, {
      type: 'authentication',
      payload: {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QifQ.z31gNHNwL1V49dzxob6dUackLpNmGCVE9aV9XhaFq7w'
      }
    })
    expect(response).toStrictEqual({ error: 'Unable to get your session' })
  })

  describe('player when i update my player', () => {
    let oAuthS
    let secondPlayerSpy
    let secondPlayer

    beforeAll(async () => {
      oAuthS = await server(process.env.oauth_discord_base_url)
      secondPlayerSpy = jest.fn()
      secondPlayer = await authWsClient(oAuthS, wsUrl)
      secondPlayer.ws.on('message', (msg) => secondPlayerSpy(JSON.parse(msg)))
    })

    afterAll(async () => {
      secondPlayer.ws.close()
      await oAuthS.destroy()
    })

    it('should notify me', async () => {
      const me = await authWsClient(oAuthS, wsUrl)

      const update = {
        type: 'player',
        payload: {
          id: me.player.id,
          pseudo: `update${randomStringNumber(4)}`,
          x: randomInt(3, 125),
          y: randomInt(3, 125)
        }
      }

      const response = await wsResponse(me.ws, update)
      expect(response).toStrictEqual(update.payload)
    })

    it('should notify every authenticated players', async () => {
      const me = await authWsClient(oAuthS, wsUrl)

      const update = {
        type: 'player',
        payload: {
          id: me.player.id,
          pseudo: `update${randomStringNumber(4)}`,
          x: randomInt(3, 125),
          y: randomInt(3, 125)
        }
      }

      await wsResponse(me.ws, update)
      expect(secondPlayerSpy).toHaveBeenCalledWith(update.payload)
    })

    it('should use my id', async () => {
      const me = await authWsClient(oAuthS, wsUrl)

      const update = {
        type: 'player',
        payload: {
          id: secondPlayer.player.id,
          pseudo: `update${randomStringNumber(4)}`,
          x: randomInt(3, 125),
          y: randomInt(3, 125)
        }
      }

      const expectedPayload = {
        ...update.payload,
        id: me.player.id
      }

      const response = await wsResponse(me.ws, update)
      expect(response).toStrictEqual(expectedPayload)
      expect(secondPlayerSpy).toHaveBeenCalledWith(expectedPayload)
    })

    it('should update get /players', async () => {
      const me = await authWsClient(oAuthS, wsUrl)

      const before = await request(`${httpUrl}/players`)
      expect(before.status).toBe(200)
      expect(before.data).toContainEqual(me.player)

      const update = {
        type: 'player',
        payload: {
          id: me.player.id,
          pseudo: `update${randomStringNumber(4)}`,
          x: randomInt(3, 125),
          y: randomInt(3, 125)
        }
      }

      await wsResponse(me.ws, update)

      const after = await request(`${httpUrl}/players`)
      expect(after.status).toBe(200)
      expect(after.data).not.toContainEqual(me.player)
      expect(after.data).toContainEqual(update.payload)
    })
  })
})
