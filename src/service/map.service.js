const jsdom = require('jsdom')
const { JSDOM } = jsdom

const d3 = require('d3')

function parseMap (mapDescription) {
  function getRandomColor (alpha) {
    const a = alpha || 1
    const num = Math.round(0xffffff * Math.random())
    const r = num >> 16
    const g = num >> 8 & 255
    const b = num & 255
    return `rgba(${r},${g},${b},${a})`
  }

  function parseRooms (houseDescription, svg) {
    const toD = d3.line()
      .x((d) => d.x)
      .y((d) => d.y)

    const isNext = (a, b) => (a.wall !== b.wall && a.p1 === b.p2)

    const isNextInverted = (a, b) => a.wall !== b.wall && ((a.p1 === b.p1) || (a.p2 === b.p2))

    const invert = (a, attr1, attr2) => {
      const v1 = a[attr1]
      const v2 = a[attr2]

      a[attr1] = v2
      a[attr2] = v1
    }

    for (const plan of houseDescription.data.plan.plans) {
      const g = svg.append('g').attr('id', 'rooms')
      for (const room of plan.pieces) {
        const walls = []
        const path = []

        const iPiece = room.id - 1
        const boundaries = plan.murs.filter(m => m.cote.some(c => c.iPiece === iPiece))
          .map(e => ({
            wall: e.id,
            pass: false,
            p1: `x:${e.x1} y:${e.y1}`,
            p2: `x:${e.x2} y:${e.y2}`,
            ...e
          }))

        let current = boundaries[0]
        while (current && !current.pass) {
          current.pass = true
          walls.push(current.id)
          path.push({
            x: current.x1,
            y: current.y1
          },
          {
            x: current.x2,
            y: current.y2
          })
          let next = boundaries.find(e => !e.pass && isNext(e, current))
          if (!next) {
            next = boundaries.find(e => !e.pass && isNextInverted(e, current))
            if (next) {
              invert(next, 'x1', 'x2')
              invert(next, 'y1', 'y2')
              invert(next, 'p1', 'p2')
            }
          }
          current = next
        }

        if (room.id === 3) {
          console.log('%o', walls)
          console.log('%s => %o', room.nom, boundaries)
        }

        if (!room.exterieur) {
          g.append('path')
            .attr('class', 'room')
            .attr('id', `room${room.id}`)
            .attr('name', room.nom)
            .attr('walls', walls)
            .attr('title', room.nom)
            .attr('d', toD(path))
            .style('stroke', getRandomColor())
            .style('stroke-width', 100)
            .style('fill', getRandomColor(0.3))
            .append('svg:title').text(room.nom)
        }
      }
    }
  }

  function parseHole (houseDescription, svg) {
    const g = svg.append('g').attr('id', 'holes')
    for (const plan of houseDescription.data.plan.plans) {
      for (const hole of plan.trous) {
        const wall = plan.murs.find(m => m.id === hole.imur)

        const direction = Math.atan2(wall.y1 - wall.y2, wall.x1 - wall.x2)
        const cos = Math.cos(direction)
        const sin = Math.sin(direction)

        const x1 = wall.x1 - cos * (hole.dcoin1 + hole.large / 2)
        const y1 = wall.y1 - sin * (hole.dcoin1 + hole.large / 2)
        const x2 = x1 + cos * hole.large
        const y2 = y1 + sin * hole.large

        g
          .append('line')
          .attr('id', `hole${hole.id}`)
          .attr('x1', Math.round(x1))
          .attr('y1', Math.round(y1))
          .attr('x2', Math.round(x2))
          .attr('y2', Math.round(y2))
          .style('stroke-width', wall.epais)
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
        g.append('line')
          .attr('id', `wall${wall.id}`)
          .attr('x1', wall.x1)
          .attr('y1', wall.y1)
          .attr('x2', wall.x2)
          .attr('y2', wall.y2)
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

  const dom = new JSDOM('<!DOCTYPE html><body></body>')

  const body = d3.select(dom.window.document.querySelector('body'))
  const svg = body.append('svg').attr('xmlns', 'http://www.w3.org/2000/svg')

  const { minX, minY, maxX, maxY } = parseWall(mapDescription, svg)

  parseHole(mapDescription, svg)
  parseRooms(mapDescription, svg)

  svg.style('maw-width', '100%')
  svg.style('maw-height', '100%')
  svg.attr('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`)
  return body
}

module.exports = {
  getMap: (mapDescription) => parseMap(mapDescription).html()
}
