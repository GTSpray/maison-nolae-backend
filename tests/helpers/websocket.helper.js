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
