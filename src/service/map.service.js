const jsdom = require('jsdom')
const { JSDOM } = jsdom

const d3 = require('d3')

class Path {
  constructor (walls) {
    const unresolveds = walls.map(e => ({
      p1: `x:${e.x1} y:${e.y1}`,
      p2: `x:${e.x2} y:${e.y2}`,
      id: e.id,
      x1: e.x1,
      y1: e.y1,
      x2: e.x2,
      y2: e.y2
    }))

    this.resolveInverted(unresolveds)
    this.walls = this.resolveSorting(unresolveds)
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

  invert (w) {
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

  resolveInverted (walls) {
    let r
    let i = 0
    do {
      i += 1
      r = walls.reduce((acc, inverted) => {
        if (
          (!walls.some(w => this.isNext(w, inverted)) &&
          !walls.some(w => this.isPrev(w, inverted))) ||
          walls.some(w => this.isSameOrigin(w, inverted))
        ) {
          this.invert(inverted)
          acc += 1
        }
        return acc
      }, 0)
    } while (r > 0 && i < walls.length)
  }

  resolveSorting (unresolveds) {
    const resolveds = []
    const walls = [...unresolveds, ...unresolveds.reverse()]
    let current
    do {
      current = walls.splice(0, 1)[0]
      if (current && !current.resolved) {
        const iNext = walls.findIndex(w => this.isNext(w, current))
        if (iNext !== -1) {
          current.resolved = true
          resolveds.push(current)
          walls.splice(0, 1, walls[iNext])
        } else if (resolveds.length > 0 && this.isPrev(current, resolveds[resolveds.length - 1])) {
          current.resolved = true
          resolveds.push(current)
        }
      }
    } while (current)
    return resolveds
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

class MapParser {
  constructor (mapDescription) {
    const dom = new JSDOM('<!DOCTYPE html><body></body>')
    this.body = d3.select(dom.window.document.querySelector('body'))
    this.svg = this.body.append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .style('maw-width', '100%')
      .style('maw-height', '100%')

    this.mapDescription = mapDescription
    this.minX = Infinity
    this.maxX = -Infinity
    this.minY = Infinity
    this.maxY = -Infinity
  }

  getRandomColor (alpha) {
    const a = alpha || 1
    const num = Math.round(0xffffff * Math.random())
    const r = num >> 16
    const g = num >> 8 & 255
    const b = num & 255
    return `rgba(${r},${g},${b},${a})`
  }

  parseWalls () {
    for (const plan of this.mapDescription.data.plan.plans) {
      const g = this.svg.append('g').attr('id', `plan${plan.etage}`)
      for (const wall of plan.murs) {
        this.minX = Math.min(this.minX, wall.x1 - wall.epais, wall.x2 - wall.epais)
        this.minY = Math.min(this.minY, wall.y1 - wall.epais, wall.y2 - wall.epais)

        this.maxX = Math.max(this.maxX, wall.x1 + wall.epais, wall.x2 + wall.epais)
        this.maxY = Math.max(this.maxY, wall.y1 + wall.epais, wall.y2 + wall.epais)

        g.append('line')
          .attr('id', `wall${wall.id}`)
          .attr('x1', wall.x1)
          .attr('y1', wall.y1)
          .attr('x2', wall.x2)
          .attr('y2', wall.y2)
          .attr('class', 'wall')
          .style('stroke-width', wall.epais)
          .style('stroke', 'orange')
          .style('stroke-linecap', 'square')
      }
    }
  }

  parseHoles () {
    const g = this.svg.append('g').attr('id', 'holes')
    for (const plan of this.mapDescription.data.plan.plans) {
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

  parseRooms () {
    const toD = d3.line()
      .x((d) => d.x)
      .y((d) => d.y)

    for (const plan of this.mapDescription.data.plan.plans) {
      const g = this.svg.append('g').attr('id', 'rooms')
      for (const room of plan.pieces) {
        if (!room.exterieur) {
          const iPiece = room.id - 1
          const boundaries = plan.murs.filter(m => m.cote.some(c => c.iPiece === iPiece))
          const p = new Path(boundaries)

          g.append('path')
            .attr('class', 'room')
            .attr('id', `room${room.id}`)
            .attr('name', room.nom)
            .attr('walls', p.walls.map(e => e.id))
            .attr('title', room.nom)
            .attr('d', toD(p.getPath()))
            .style('stroke', this.getRandomColor())
            .style('stroke-width', 100)
            .style('fill', this.getRandomColor(0.3))
            .append('svg:title').text(room.nom)
        }
      }
    }
  }

  parseObjects () {
    const g = this.svg.append('g').attr('id', 'obj')
    for (const plan of this.mapDescription.data.plan.plans) {
      for (const obj of plan.objets) {
        const w = Math.round(obj.l)
        const h = Math.round(obj.h)
        const x = Math.round(obj.x - (w / 2))
        const y = Math.round(obj.y - (h / 2))

        const oriX = Math.round(obj.x)
        const oriY = Math.round(obj.y)
        const angle = Math.round(obj.a)

        g
          .append('rect')
          .attr('id', `obj${obj.id}`)
          .attr('class', 'obj')
          .attr('x', x)
          .attr('y', y)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', `rotate(${angle},${oriX},${oriY})`)
      }
    }
  }

  parse () {
    this.parseWalls()
    this.parseRooms()
    this.parseHoles()
    this.parseObjects()
    this.svg.attr(
      'viewBox',
      `${this.minX} ${this.minY} ${this.maxX - this.minX} ${this.maxY - this.minY}`
    )
  }

  getSvg () {
    return this.body.html()
  }
}

module.exports = {
  Path,
  MapParser
}
