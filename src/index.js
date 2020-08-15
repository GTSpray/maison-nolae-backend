const express = require("express");
const bodyParser = require("body-parser");
const expressWs = require("express-ws");
const chalk = require("chalk");
const { v4: uuidv4 } = require("uuid");
const favicon = require("serve-favicon");
const path = require("path");
const fetch = require("node-fetch");

const apiContracts = require("../contract.js");

const config = require("../.config/endpoint.js");

const Ajv = require("ajv");
const ajv = Ajv({ allErrors: true });
const validatePlayer = ajv.compile(apiContracts);

const app = express();
expressWs(app);

function serverLog(data, color, type) {
  const d = new Date(Date.now());
  let log = "";
  data = data.toString().split(/\r?\n/);
  data.forEach((line) => {
    log += `  ${line}\n`;
  });
  if (/[0-9A-z]+/.test(log)) {
    console.log(
      chalk[color].bold(` ┏ ${type} -------------------`) +
        "\n\n" +
        log +
        "\n" +
        chalk[color].bold(` ┗ ${d.toLocaleString()} ------`) +
        "\n"
    );
  }
}

app.set('port', (process.env.PORT || 8080))
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", config.fronturl);
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Max-Age", "1728000");
  next();
});

const sessions = new Map();

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.get("/contracts", (_req, res) => {
  res.json(apiContracts);
});

app.get("/players", (_req, res) => {
  const players = Array.from(sessions.values()).map((e) => e.player);
  res.json(players);
});

app.post("/auth", (req, res) => {
  if(req.body.code){
    const data = {
      client_id: process.env.oauth_discord_client_id,
      client_secret: process.env.oauth_discord_client_secret,
      grant_type: "authorization_code",
      redirect_uri: process.env.oauth_discord_redirect_uri,
      code: req.body.code,
      scope: "identify,guilds"
    };

    fetch("https://discordapp.com/api/oauth2/token", {
          method: "POST",
          body: new URLSearchParams(data),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        })
          .then((discordRes) => discordRes.json())
          .then((info) =>
            [
              "https://discordapp.com/api/users/@me",
              "https://discordapp.com/api/users/@me/guilds"
            ].map((url) => ({
              url,
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
            const [user, guilds] = infos;
            if (user && guilds) {
              res.json({
                pseudo: `${user.username}#${user.discriminator}`,
                inserver: guilds.some((e) => e.id === process.env.oauth_discord_id_server_discord)
              })
            } else {
              res.json({
                message: 'error'
              })
            }
          })
          .catch((e) => {
            console.error(e);
            res.json({
              message: 'error'
            })
          });
      } else {
        res.json({
          message: 'no authent'
        })
      }
});

app.ws("/", (ws, req) => {
  const ip = req.headers["x-real-ip"];
  const session = sessions.has(ip)
    ? sessions.get(ip)
    : {
        player: {
          id: uuidv4(),
          pseudo: "",
          x: 0,
          y: 0
        },
        ws: []
      };

  session.ws.push(ws);
  sessions.set(ip, session);

  serverLog(
    `New client ${session.player.id} with ip: ${ip}`,
    "green",
    "WS Server"
  );

  ws.on("message", (msg) => {
    try {
      const p = JSON.parse(msg);
      const valid = validatePlayer(p);
      if (valid) {
        const id = session.player.id;
        session.player = {
          ...p,
          id
        };
        const ps = JSON.stringify(session.player);
        sessions.forEach((s) => {
          for (const i in s.ws) {
            if (s.ws.hasOwnProperty(i)) {
              s.ws[i].send(ps);
            }
          }
        });
      } else {
        console.error(session.player.id, validatePlayer.errors);
      }
    } catch (error) {
      console.error(session.player.id, error);
    }
  });

  ws.on("close", () => {
    session.ws = session.ws.filter((e) => e !== ws);
    if (session.ws.lengt === 0) {
      serverLog(`Player quit ${session.player.id}`, "green", "WS Server");
      sessions.delete(ip);
    } else {
      serverLog(
        `Client quit ${session.player.id} with ip: ${ip}`,
        "green",
        "WS Server"
      );
    }
  });
});

app.listen(app.get('port'), function() {
  serverLog(`Server listening at http://localhost:${app.get('port')}`, "blue", "Server");
})
