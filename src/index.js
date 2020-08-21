require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const { v4: uuidv4 } = require('uuid')
const favicon = require('serve-favicon')
const path = require('path')
const fetch = require('node-fetch')
const { serverLog } = require('./serverLog')

const authService = require('./auth.service')

const apiContracts = require('../contract.js')

const config = require('../.config/endpoint.js')

const Ajv = require('ajv')
const ajv = Ajv({ allErrors: true })

const authenticatedUsers = new Map()

const port = process.env.PORT || 8080
const app = express()
  .set('port', port)
  .use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json())
  .use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.fronturl)
    res.header('Access-Control-Allow-Methods', '*')
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Max-Age', '1728000')

    next()
  })
  .get('/', (_req, res) => {
    res.json({
      message: 'Hello Wrold!'
    })
  })
  .get('/contracts', (_req, res) => {
    res.json(apiContracts)
  })
  .get('/players', (_req, res) => {
    const players = Array.from(authenticatedUsers.values()).map(
      (e) => e.player
    )
    res.json(players)
  })
  .post('/auth', (req, res) => {
    if (req.body.code) {
      const data = {
        client_id: process.env.oauth_discord_client_id,
        client_secret: process.env.oauth_discord_client_secret,
        grant_type: 'authorization_code',
        redirect_uri: process.env.oauth_discord_redirect_uri,
        code: req.body.code,
        scope: 'identify,guilds'
      }

      fetch(`${process.env.oauth_discord_base_url}/oauth2/token`, {
        method: 'POST',
        body: new URLSearchParams(data),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
        .then((discordRes) => discordRes.json())
        .then((info) =>
          ['@me', '@me/guilds'].map((path) => ({
            url: `${process.env.oauth_discord_base_url}/users/${path}`,
            opts: {
              headers: {
                authorization: `${info.token_type} ${info.access_token}`
              }
            }
          }))
        )
        .then((qs) => Promise.all(qs.map((q) => fetch(q.url, q.opts))))
        .then((resp) => Promise.all(resp.map((r) => r.json())))
        .then((infos) => {
          const [me, guilds] = infos
          if (
            me &&
            guilds &&
            guilds.some(
              (e) => e.id === process.env.oauth_discord_id_server_discord
            )
          ) {
            const pseudo = `${me.username}#${me.discriminator}`
            if (!authenticatedUsers.has(pseudo)) {
              const id = uuidv4()
              serverLog(`${pseudo} ${id}`, 'green', 'WS Server')
              authenticatedUsers.set(pseudo, {
                discord: pseudo,
                player: {
                  id,
                  pseudo: me.username,
                  x: 0,
                  y: 0
                },
                ws: []
              })
            }
            const session = authenticatedUsers.get(pseudo)
            res.json({
              player: session.player,
              token: authService.issue({
                id: session.player.id,
                pseudo
              })
            })
          } else {
            res.status(403).json({
              message: 'forbidden'
            })
          }
        })
        .catch((e) => {
          console.error(e)
          res.status(401).json({
            message: 'discord fail'
          })
        })
    } else {
      res.status(401).json({
        message: 'no authent'
      })
    }
  })
  .listen(port, () => {
    serverLog(`Server listening at http://localhost:${port}`, 'blue', 'Server')
  })

const { Server } = require('ws')
const wss = new Server({ server: app })
const validateWebsocket = ajv.compile(apiContracts.websocket)
const validatePlayer = ajv.compile(apiContracts.player)
const validateAuthentication = ajv.compile(apiContracts.authentication)

wss.on('connection', (ws) => {
  let session = null
  ws.on('close', () => {
    if (session) {
      session.ws = session.ws.filter((e) => e !== ws)
      if (session.ws.lengt === 0) {
        serverLog(`Player quit ${session.player.id}`, 'green', 'WS Server')
        authenticatedUsers.delete(session.discord)
      }
    }
  })
  ws.on('message', (message) => {
    try {
      var event = JSON.parse(message)
      const valid = validateWebsocket(event)
      if (!valid) {
        throw validateWebsocket.errors[0]
      }
      ws.emit(event.type, event.payload)
    } catch (error) {
      console.error('not an event', error)
      ws.emit('_error', {
        error: 'invalid event'
      })
    }
  })

    .on('_error', (error) => {
      ws.send(JSON.stringify(error))
    })

    .on('authentication', (payload) => {
      const valid = validateAuthentication(payload)
      if (valid) {
        authService.verify(payload.token, (err, decoded) => {
          if (err || !authenticatedUsers.has(decoded.pseudo)) {
            ws.emit('_error', {
              error: 'Unable to get your session'
            })
          } else {
            session = authenticatedUsers.get(decoded.pseudo)
            session.ws.push(ws)
          }
        })
      } else {
        console.error(validateAuthentication.errors)
        ws.emit('_error', {
          error: 'Invalid auth method'
        })
      }
    })
    .on('player', (payload) => {
      if (session) {
        const valid = validatePlayer(payload)
        if (valid) {
          const id = session.player.id
          session.player = {
            ...payload,
            id
          }
          const ps = JSON.stringify(session.player)
          authenticatedUsers.forEach((s) => {
            for (const i in s.ws) {
              if (Object.prototype.hasOwnProperty.call(s.ws, i)) {
                s.ws[i].send(ps)
              }
            }
          })
        } else {
          console.error(session.player.id, validatePlayer.errors)
        }
      } else {
        ws.send('Not authentified session')
        console.error('Not authentified session')
      }
    })
})
