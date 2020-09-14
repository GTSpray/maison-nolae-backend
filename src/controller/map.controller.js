const mapService = require('../service/map.service')

module.exports = {
  getMap: (_req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(mapService.getMap())
  }
}
