const WebSocket = require('ws')

const callSocket = (url, message) =>
  new Promise((resolve) => {
    const ws = new WebSocket(url)
      .on('open', () => {
        ws.send(
          typeof message === 'string' ? message : JSON.stringify(message)
        )
      })
      .on('message', (message) => {
        ws.close()
        try {
          const json = JSON.parse(message)
          resolve(json)
        } catch (error) {
          resolve(message)
        }
      })
  })

describe('Websocket', () => {
  const url = `ws://localhost:${process.env.PORT}`

  it('should connect websockets', (done) => {
    expect.assertions(1)
    const ws = new WebSocket(url)
      .on('open', () => {
        expect(true).toBe(true)
        ws.close()
      })
      .on('close', () => done())
  })

  it('should respond invalid event when message is not event', async () => {
    const response = await callSocket(url, {})
    expect(response).toStrictEqual({ error: 'invalid event' })
  })

  it('should respond invalid event when message is string', async () => {
    const response = await callSocket(url, 'not json')
    expect(response).toStrictEqual({ error: 'invalid event' })
  })

  it('should respond invalid auth method when authentication.token is bad formated ', async () => {
    const response = await callSocket(url, {
      type: 'authentication',
      payload: {
        token: 'badformated'
      }
    })
    expect(response).toStrictEqual({ error: 'Invalid auth method' })
  })

  it('should respond unable to get session when user use token from another platform', async () => {
    const response = await callSocket(url, {
      type: 'authentication',
      payload: {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QifQ.z31gNHNwL1V49dzxob6dUackLpNmGCVE9aV9XhaFq7w'
      }
    })
    expect(response).toStrictEqual({ error: 'Unable to get your session' })
  })
})
