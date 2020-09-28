const mapService = require('../service/map.service')
const mapDescription = require('../service/loadPlan.json')

const svgMap = mapService.getMap(mapDescription)

module.exports = {
  getMap: (_req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(svgMap)
  }
}
