module.exports = {
  cors: (_req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.fronturl)
    res.header('Access-Control-Allow-Methods', '*')
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Max-Age', '1728000')

    next()
  }
}
