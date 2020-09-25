var archifacile = require('./loadPlan3.json')

const jsdom = require('jsdom')
const { JSDOM } = jsdom

const d3 = require('d3')

function getRandomColor () {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

const dom = new JSDOM('<!DOCTYPE html><body></body>')

const body = d3.select(dom.window.document.querySelector('body'))
const svg = body.append('svg').attr('xmlns', 'http://www.w3.org/2000/svg')

const { minX, minY, maxX, maxY } = parseWall(archifacile, svg)

parseHole(archifacile, svg)
parseRooms(archifacile, svg)

svg.style('maw-width', '100%')
svg.style('maw-height', '100%')
svg.attr('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`)

function parseRooms (houseDescription, svg) {
  const toD = d3.line()
    .x((d) => d.x)
    .y((d) => d.y)

  const isNext = (a, b) => (a.wall !== b.wall && (a.x1 === b.x2 &&
 a.y1 === b.y2))

  const isNextInverted = (a, b) => a.wall !== b.wall && ((a.x1 === b.x1 &&
 a.y1 === b.y1) || (a.x2 === b.x2 &&
 a.y2 === b.y2))

  for (const plan of houseDescription.data.plan.plans) {
    const g = svg.append('g').attr('id', 'rooms')
    for (const room of plan.pieces) {
      const boundaries = []
      const walls = []
      const path = []
      svg.selectAll(`line.boundary[room="${room.id - 1}"`)
        .each(function () {
          const boundary = d3.select(this)
          boundaries.push({
            pass: 0,
            wall: boundary.attr('wall'),
            x1: parseInt(boundary.attr('x1'), 10),
            y1: parseInt(boundary.attr('y1'), 10),
            x2: parseInt(boundary.attr('x2'), 10),
            y2: parseInt(boundary.attr('y2'), 10)
          })
        })

      let current = boundaries[0]
      while (current && current.pass < 1) {
        current.pass += 1
        walls.push(current.wall)
        path.push({
          x: current.x1,
          y: current.y1
        },
        {
          x: current.x2,
          y: current.y2
        })
        let next = boundaries.find(e => isNext(e, current))
        if (!next) {
          next = boundaries.find(e => isNextInverted(e, current) && !walls.includes(e.wall))
          if (next) {
            next = {
              wall: next.wall,
              pass: 0,
              x1: next.x2,
              y1: next.y2,
              x2: next.x1,
              y2: next.y1
            }
          }
        }
        current = next
      }

      if (!room.exterieur) {
        g.append('path')
          .attr('class', 'room')
          .attr('id', `room${room.id}`)
          .attr('name', room.nom)
          .attr('walls', walls)
          .attr('d', toD(path))
          .style('stroke', getRandomColor())
          .style('stroke-width', 100)
          .style('fill', 'none')
      }
    }
  }
}

function parseHole (houseDescription, svg) {
  const g = svg.append('g').attr('id', 'holes')
  for (const plan of houseDescription.data.plan.plans) {
    for (const hole of plan.trous) {
      const wall = svg.select(`#wall${hole.imur}`)

      const direction = parseFloat(wall.attr('direction'))
      const cos = Math.cos(direction)
      const sin = Math.sin(direction)

      const x1 = parseInt(wall.attr('x1'), 10) - cos * (hole.dcoin1 + hole.large / 2)
      const y1 = parseInt(wall.attr('y1'), 10) - sin * (hole.dcoin1 + hole.large / 2)
      const x2 = x1 + cos * hole.large
      const y2 = y1 + sin * hole.large

      g
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
    const g = svg.append('g').attr('id', `plan${plan.etage}`)
    for (const wall of plan.murs) {
      minX = Math.min(minX, wall.x1 - wall.epais, wall.x2 - wall.epais)
      minY = Math.min(minY, wall.y1 - wall.epais, wall.y2 - wall.epais)

      maxX = Math.max(maxX, wall.x1 + wall.epais, wall.x2 + wall.epais)
      maxY = Math.max(maxY, wall.y1 + wall.epais, wall.y2 + wall.epais)

      const color = 'orange'
      for (const boundary of wall.cote) {
        g.append('line')
          .attr('x1', wall.x1)
          .attr('y1', wall.y1)
          .attr('x2', wall.x2)
          .attr('y2', wall.y2)
          .attr('room', boundary.iPiece)
          .attr('wall', wall.id)
          .attr('class', 'boundary')
      }

      g.append('line')
        .attr('id', `wall${wall.id}`)
        .attr('x1', wall.x1)
        .attr('y1', wall.y1)
        .attr('x2', wall.x2)
        .attr('y2', wall.y2)
        .attr('direction', Math.atan2(wall.y1 - wall.y2, wall.x1 - wall.x2))
        .attr('class', 'wall')
        .style('stroke-width', wall.epais)
        .style('stroke', color)
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
