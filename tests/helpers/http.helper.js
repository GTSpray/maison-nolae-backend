const express = require('express')
const bodyParser = require("body-parser")
const axios = require('axios').default

module.exports.request = async (url, options) => {
  let r
  try {
    r = await axios.request(url, options)
  } catch (error) {
    if (error.response) {
      r = error
    } else {
      throw error
    }
  }
  return r
}

module.exports.server = (fakeUrl) =>
  new Promise((resolve) => {
    const url = new URL(fakeUrl)
    const response = jest.fn()
    const request = jest.fn()

    const fakeApp = express()
      .use(bodyParser.urlencoded({ extended: true }))
      .use((req, res) => {
        const bleh = (({ method, query, originalUrl, headers, body }) => ({
          method,
          originalUrl,
          headers,
          body,
          query
        }))(req)
        request(bleh)
        response(req, res)
      })

    const server = fakeApp.listen(url.port, () => {
      resolve({
        destroy: () => new Promise((r) => server.close(r)),
        url,
        response,
        request
      })
    })
  })
