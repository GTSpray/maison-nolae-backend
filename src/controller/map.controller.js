const mapService = require('../service/map.service')
const mapDescription = require('../../tests/mockdatas/nolae-house.json')

const svgMap = mapService.getMap(mapDescription)

module.exports = {
  getMap: (_req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(svgMap)
  }
}
