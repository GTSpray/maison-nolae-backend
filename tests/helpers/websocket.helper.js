const WebSocket = require('ws')

module.exports.wsClient = (url) => new WebSocket(url)

module.exports.socketResponse = (url, message) =>
  new Promise((resolve) => {
    const ws = new WebSocket(url)
      .on('open', () => {
        ws.send(
          typeof message === 'string' ? message : JSON.stringify(message)
        )
      })
      .on('message', (msg) => {
        ws.close()
        try {
          const json = JSON.parse(msg)
          resolve(json)
        } catch (error) {
          resolve(msg)
        }
      })
  })
