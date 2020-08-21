const jwt = require('jsonwebtoken')

const secret = process.env.jwt_secret

module.exports = {
  issue: (payload) => jwt.sign(payload, secret, { expiresIn: 10800 }),
  verify: (token, cb) => jwt.verify(token, secret, {}, cb)
}
