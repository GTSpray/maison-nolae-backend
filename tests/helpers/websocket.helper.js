const WebSocket = require('ws')
const { randomAuth } = require('./http.helper')

module.exports.wsClient = (url) => new WebSocket(url)

module.exports.authWsClient = (oAuthS, url) => new Promise((resolve) => {
  const authUrl = `http://localhost:${process.env.PORT}/auth`

  const ws = new WebSocket(url)
    .on('open', async () => {
      const authResponse = await randomAuth(oAuthS, authUrl)
      ws.send(JSON.stringify({
        type: 'authentication',
        payload: {
          token:
            authResponse.token
        }
      }))
      resolve({
        token: authResponse.token,
        ws,
        player: authResponse.player
      })
    })
})

module.exports.wsResponse = (ws, message) => new Promise((resolve) => {
  ws.on('message', (message) => {
    ws.close()
    try {
      const json = JSON.parse(message)
      resolve(json)
    } catch (error) {
      resolve(message)
    }
  })
  ws.send(
    typeof message === 'string' ? message : JSON.stringify(message)
  )
})

module.exports.socketResponse = (url, message) =>
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
