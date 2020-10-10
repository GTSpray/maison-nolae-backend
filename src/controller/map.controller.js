const fetch = require('node-fetch')

const { MapParser } = require('../service/map.service')
let mapDescription
let svgMap

module.exports = {
  getMap: async (_req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml')

    if (!mapDescription) {
      const getDesc = await fetch(`https://www.archifacile.fr/api/loadPlan?cle=${process.env.archifacile_plan_id}`)
      mapDescription = await getDesc.json()
    }

    if (!svgMap) {
      const parser = new MapParser(mapDescription)
      parser.parse()
      svgMap = parser.getSvg()
    }

    res.send(svgMap)
  }
}
