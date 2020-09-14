var archifacile = require('./loadPlan.json')

var jsdom = require('jsdom')
const { JSDOM } = jsdom

const d3 = require('d3')

const dom = new JSDOM('<!DOCTYPE html><body></body>')

const body = d3.select(dom.window.document.querySelector('body'))
const svg = body.append('svg').attr('xmlns', 'http://www.w3.org/2000/svg')
const { minX, minY, maxX, maxY } = parseWall(archifacile, svg)

for (const plan of archifacile.data.plan.plans) {
  for (const trou of plan.trous) {
    const mur = svg.select(`#mur${trou.imur}`)
    const isHorizontal = mur.attr('x1') === mur.attr('x2')
    const x = isHorizontal ? mur.attr('x2') : Math.min(mur.attr('x1'), mur.attr('x2')) + trou.dcoin1
    const y = !isHorizontal ? mur.attr('y2') : Math.min(mur.attr('y1'), mur.attr('y2')) + trou.dcoin1

    const w = !isHorizontal ? trou.large : mur.attr('epais')
    const h = isHorizontal ? trou.large : mur.attr('epais')

    svg.append('rect')
      .attr('x', x - w / 2)
      .attr('y', y - h / 2)
      .attr('width', w)
      .attr('height', h)
      .style('fill', 'blue')
  }
}

svg.style('width', '100%')
svg.attr('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`)

function parseWall (houseDescription, svg) {
  let minX = Infinity; let maxX = -Infinity
  let minY = Infinity; let maxY = -Infinity
  for (const plan of houseDescription.data.plan.plans) {
    for (const mur of plan.murs) {
      minX = Math.min(minX, mur.x1 - mur.epais, mur.x2 - mur.epais)
      minY = Math.min(minY, mur.y1 - mur.epais, mur.y2 - mur.epais)

      maxX = Math.max(maxX, mur.x1 + mur.epais, mur.x2 + mur.epais)
      maxY = Math.max(maxY, mur.y1 + mur.epais, mur.y2 + mur.epais)

      svg.append('line')
        .attr('id', `mur${mur.id}`)
        .attr('x1', mur.x1)
        .attr('y1', mur.y1)
        .attr('x2', mur.x2)
        .attr('y2', mur.y2)
        .attr('epais', mur.epais)
        .style('stroke-width', mur.epais)
        .style('stroke', 'orange')
        .style('stroke-linecap', 'square')
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
