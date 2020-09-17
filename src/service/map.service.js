var archifacile = require('./loadPlan.json')

function getRandomColor () {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

var jsdom = require('jsdom')
const { JSDOM } = jsdom

const d3 = require('d3')

const dom = new JSDOM('<!DOCTYPE html><body></body>')

const body = d3.select(dom.window.document.querySelector('body'))
const svg = body.append('svg').attr('xmlns', 'http://www.w3.org/2000/svg')
const { minX, minY, maxX, maxY } = parseWall(archifacile, svg)

parseHole(archifacile, svg)

for (const plan of archifacile.data.plan.plans) {
  for (const room of plan.pieces) {
    svg.selectAll(`.wall.ofroom${room.id}`).style('stroke', getRandomColor())
  }
}

svg.style('width', '100%')
svg.attr('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`)

function parseHole (houseDescription, svg) {
  for (const plan of houseDescription.data.plan.plans) {
    for (const hole of plan.trous) {
      const wall = svg.select(`#wall${hole.imur}`)

      const direction = wall.attr('direction')
      const cos = Math.cos(direction)
      const sin = Math.sin(direction)

      const x1 = wall.attr('x1') - cos * (hole.dcoin1 + hole.large / 2)
      const y1 = wall.attr('y1') - sin * (hole.dcoin1 + hole.large / 2)
      const x2 = x1 + cos * hole.large
      const y2 = y1 + sin * hole.large

      svg
        .append('line')
        .attr('id', `hole${hole.id}`)
        .attr('x1', Math.round(x1))
        .attr('y1', Math.round(y1))
        .attr('x2', Math.round(x2))
        .attr('y2', Math.round(y2))
        .style('stroke-width', wall.style('stroke-width'))
        .style('stroke', 'blue')
    }
  }
}

function parseWall (houseDescription, svg) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const plan of houseDescription.data.plan.plans) {
    for (const wall of plan.murs) {
      minX = Math.min(minX, wall.x1 - wall.epais, wall.x2 - wall.epais)
      minY = Math.min(minY, wall.y1 - wall.epais, wall.y2 - wall.epais)

      maxX = Math.max(maxX, wall.x1 + wall.epais, wall.x2 + wall.epais)
      maxY = Math.max(maxY, wall.y1 + wall.epais, wall.y2 + wall.epais)

      wall.color = 'orange'

      const direction = Math.atan2(wall.y1 - wall.y2, wall.x1 - wall.x2)

      svg
        .append('line')
        .attr('id', `wall${wall.id}`)
        .attr('x1', wall.x1)
        .attr('y1', wall.y1)
        .attr('x2', wall.x2)
        .attr('y2', wall.y2)
        .attr('epais', wall.epais)
        .attr('direction', direction)
        .style('stroke-width', wall.epais)
        .style('stroke', wall.color)
        .style('stroke-linecap', 'square')
        .attr(
          'class',
          `wall ${wall.cote.map((e) => `ofroom${e.iPiece}`).join(' ')}`
        )
    }
  }
  return {
    minX,
    minY,
    maxX,
    maxY
  }
}

module.exports = {
  getMap: () => body.html()
}
