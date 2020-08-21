const { socketResponse, wsClient } = require('./helpers/websocket.helper')

describe('Websocket', () => {
  const url = `ws://localhost:${process.env.PORT}`

  it('should connect websockets', (done) => {
    expect.assertions(1)
    const ws = wsClient(url)
      .on('open', () => {
        expect(true).toBe(true)
        ws.close()
      })
      .on('close', () => done())
  })

  it('should not share ws sessions', async () => {
    expect.assertions(2)
    const spy = jest.fn()
    const ws = wsClient(url).on('message', spy)

    const response = await socketResponse(url, 'not json')
    ws.close()

    expect(spy).not.toHaveBeenCalled()
    expect(response).toBeDefined()
  })

  it('should respond invalid event when message is not event', async () => {
    const response = await socketResponse(url, {})
    expect(response).toStrictEqual({ error: 'invalid event' })
  })

  it('should respond invalid event when message is string', async () => {
    const response = await socketResponse(url, 'not json')
    expect(response).toStrictEqual({ error: 'invalid event' })
  })

  it('should respond invalid auth method when authentication.token is bad formated ', async () => {
    const response = await socketResponse(url, {
      type: 'authentication',
      payload: {
        token: 'badformated'
      }
    })
    expect(response).toStrictEqual({ error: 'Invalid auth method' })
  })

  it('should respond unable to get session when user use token from another platform', async () => {
    const response = await socketResponse(url, {
      type: 'authentication',
      payload: {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QifQ.z31gNHNwL1V49dzxob6dUackLpNmGCVE9aV9XhaFq7w'
      }
    })
    expect(response).toStrictEqual({ error: 'Unable to get your session' })
  })
})
