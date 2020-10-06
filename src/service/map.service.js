const jsdom = require('jsdom')
const { JSDOM } = jsdom

const d3 = require('d3')

class Path {
  constructor (walls) {
    this.walls = []
    this.unresolved = walls.map(e => ({
      p1: `x:${e.x1} y:${e.y1}`,
      p2: `x:${e.x2} y:${e.y2}`,
      id: e.id,
      x1: e.x1,
      y1: e.y1,
      x2: e.x2,
      y2: e.y2
    }))
  }

  isNext (a, b) {
    return (a.id !== b.id && a.p1 === b.p2)
  }

  isPrev (a, b) {
    return this.isNext(b, a)
  }

  isSameOrigin (a, b) {
    return (a.id !== b.id && a.p1 === b.p1)
  }

  resolve () {
    const invert = (w) => {
      const invertAttr = (a, attr1, attr2) => {
        const v1 = a[attr1]
        const v2 = a[attr2]
        a[attr1] = v2
        a[attr2] = v1
      }

      invertAttr(w, 'x1', 'x2')
      invertAttr(w, 'y1', 'y2')
      invertAttr(w, 'p1', 'p2')
      return w
    }

    let r
    do {
      r = this.unresolved.reduce((acc, inverted) => {
        if (
          (!this.unresolved.some(w => this.isNext(w, inverted)) &&
          !this.unresolved.some(w => this.isPrev(w, inverted))) ||
          this.unresolved.some(w => this.isSameOrigin(w, inverted))
        ) {
          invert(inverted)
          acc += 1
        }
        return acc
      }, 0)
    } while (r > 0)

    const path = []
    const unresolveds = [...this.unresolved, ...this.unresolved.reverse()]

    let current
    do {
      current = unresolveds.splice(0, 1)[0]
      if (current && !current.resolved) {
        const iNext = unresolveds.findIndex(w => this.isNext(w, current))
        if (iNext !== -1) {
          current.resolved = true
          path.push(current)
          unresolveds.splice(0, 1, unresolveds[iNext])
        } else if (path.length > 0 && this.isPrev(current, path[path.length - 1])) {
          current.resolved = true
          path.push(current)
        }
      }
    } while (current)

    this.unresolved = this.unresolved.filter(e => !e.resolved)

    if (path.length > this.walls.length) {
      this.walls = path
    }
  }

  getPath () {
    const path = []
    for (const w of this.walls) {
      path.push(
        { x: w.x1, y: w.y1 },
        { x: w.x2, y: w.y2 }
      )
    }
    return path
  }
}

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

    for (const plan of houseDescription.data.plan.plans) {
      const g = svg.append('g').attr('id', 'rooms')
      for (const room of plan.pieces) {
        if (!room.exterieur) {
          const iPiece = room.id - 1
          const boundaries = plan.murs.filter(m => m.cote.some(c => c.iPiece === iPiece))
          const p = new Path(boundaries)
          p.resolve()

          g.append('path')
            .attr('class', 'room')
            .attr('id', `room${room.id}`)
            .attr('name', room.nom)
            .attr('walls', p.walls.map(e => e.id))
            .attr('title', room.nom)
            .attr('d', toD(p.getPath()))
            .style('stroke', getRandomColor())
            .style('stroke-width', 100)
            .style('fill', getRandomColor(0.3))
            .append('svg:title').text(room.nom)
        }
      }
    }
  }

  function parseHoles (houseDescription, svg) {
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

  function parseWalls (houseDescription, svg) {
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

  const { minX, minY, maxX, maxY } = parseWalls(mapDescription, svg)

  parseHoles(mapDescription, svg)
  parseRooms(mapDescription, svg)

  svg.style('maw-width', '100%')
  svg.style('maw-height', '100%')
  svg.attr('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`)
  return body
}

module.exports = {
  getMap: (mapDescription) => parseMap(mapDescription).html(),
  Path
}
