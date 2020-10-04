const mapService = require('../src/service/map.service')
const archifacile = require('../src/service/loadPlan3.json')
const nolaeHouse = require('../src/service/loadPlan.json')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const d3 = require('d3')

function perm (xs) {
  const ret = []

  for (let i = 0; i < xs.length; i = i + 1) {
    const rest = perm(xs.slice(0, i).concat(xs.slice(i + 1)))

    if (!rest.length) {
      ret.push([xs[i]])
    } else {
      for (let j = 0; j < rest.length; j = j + 1) {
        ret.push([xs[i]].concat(rest[j]))
      }
    }
  }
  return ret
}

expect.extend({
  matchOrder (received, expected) {
    const pass = (expected.split(',')).length === (received.split(',')).length && `${received},${received}`.search(expected) !== -1
    return {
      pass,
      message: () => pass ? '' : `expected ${received} to match with order ${expected}`
    }
  }
})

const invertWall = (w) => {
  const invertAttr = (a, attr1, attr2) => {
    const v1 = a[attr1]
    const v2 = a[attr2]

    a[attr1] = v2
    a[attr2] = v1
  }

  invertAttr(w, 'x1', 'x2')
  invertAttr(w, 'y1', 'y2')
  invertAttr(w, 'p1', 'p2')
}

describe('archifacile integration', () => {
  describe('Path', () => {
    const wallList = [
      { x1: 0, y1: 0, x2: 0, y2: 1 },
      { x1: 0, y1: 1, x2: 1, y2: 1 },
      { x1: 1, y1: 1, x2: 1, y2: 0 },
      { x1: 1, y1: 0, x2: 0, y2: 0 }
    ].map((e, i) => ({
      wall: i + 1,
      p1: `x:${e.x1} y:${e.y1}`,
      p2: `x:${e.x2} y:${e.y2}`,
      ...e
    }))

    const permutations = perm(wallList.map(e => e.wall)).map(e => e.join(','))

    describe.each(permutations)(
      'in order %s',
      (permutation) => {
        let walls
        beforeEach(() => {
          walls = permutation.split(',').map(id => ({
            ...wallList[id - 1]
          }))
        })

        it('should resolve simple path', () => {
          const path = new mapService.Path(walls)
          path.resolve()
          expect(path.walls.map(e => e.wall).join(',')).matchOrder('1,2,3,4')
        })

        it.each(wallList.map((_e, i) => i))('should resolve path with %s inversed wall', (iWall) => {
          invertWall(walls[iWall])
          const path = new mapService.Path(walls)
          path.resolve()
          expect(path.walls.map(e => e.wall).join(',')).matchOrder('1,2,3,4')
        })
      }
    )
  })

  describe.skip('testing plan', () => {
    const dom = new JSDOM(mapService.getMap(archifacile))
    const map = d3.select(dom.window.document.querySelector('svg'))

    it('should set viewbox of map boudaries', () => {
      expect(map.attr('viewBox')).toEqual('-3668 -3122 19884 18252')
    })

    const walls = archifacile.data.plan.plans.reduce((acc, plan) => {
      acc.push(...plan.murs.map(e => [e.id, e]))
      return acc
    }, [])

    describe.each(walls)(
      'for wall %s',
      (wallId, desc) => {
        let line
        beforeAll(() => {
          line = map.select(`line#wall${wallId}`)
        })
        it('should make a line', () => {
          expect(line).toBeDefined()
          expect(line.empty()).toBeFalsy()
        })

        it.each(['x1', 'x2', 'y1', 'y2'])(
          'should set %s',
          (attr) => {
            expect(line.attr(attr)).toEqual(`${desc[attr]}`)
          }
        )

        it('should set width', () => {
          expect(line.style('stroke-width')).toEqual(`${desc.epais}`)
        })
      }
    )

    const holes = [
      [1, { x1: '2945', y1: '5035', x2: '3745', y2: '5035', epais: 250 }],
      [2, { x1: '15966', y1: '14159', x2: '15966', y2: '13359', epais: 250 }],
      [3, { x1: '13048', y1: '6233', x2: '13048', y2: '5433', epais: 250 }],
      [4, { x1: '7259', y1: '2203', x2: '7259', y2: '803', epais: 250 }],
      [5, { x1: '606', y1: '11389', x2: '1197', y2: '10850', epais: 250 }]
    ]

    describe.each(holes)(
      'for hole %s',
      (wallId, desc) => {
        let line
        beforeAll(() => {
          line = map.select(`line#hole${wallId}`)
        })
        it('should make a line', () => {
          expect(line).toBeDefined()
          expect(line.empty()).toBeFalsy()
        })

        it.each(['x1', 'x2', 'y1', 'y2'])(
          'should set %s',
          (attr) => {
            expect(line.attr(attr)).toEqual(`${desc[attr]}`)
          }
        )

        it('should set width', () => {
          expect(line.style('stroke-width')).toEqual(`${desc.epais}`)
        })
      }
    )

    const rooms = [
      ['B', { id: 1, walls: '8,5,6,7' }],
      ['D', { id: 3, walls: '13,14,15,16' }],
      ['A', { id: 4, walls: '1,8,2,21,3,4' }],
      ['E', { id: 6, walls: '21,17,18,19,20' }],
      ['F', { id: 8, walls: '23,24,26' }],
      ['C', { id: 5, walls: '1,5,6,7,2,17,18,22,10,9,12,11,23,25,20,3,4' }]
    ]

    describe.each(rooms)(
      'for room %s',
      (_roomNam, desc) => {
        let path
        beforeAll(() => {
          path = map.select(`path#room${desc.id}`)
        })

        it('should make a path', () => {
          expect(path).toBeDefined()
          expect(path.empty()).toBeFalsy()
        })

        it('should set walls with his walls', () => {
          expect(path.attr('walls')).toEqual(desc.walls)
        })
      }
    )
  })

  describe.skip('Nolae\'s house', () => {
    const dom = new JSDOM(mapService.getMap(nolaeHouse))
    const map = d3.select(dom.window.document.querySelector('svg'))

    it('should set viewbox of map boudaries', () => {
      expect(map.attr('viewBox')).toEqual('-12877 -8658 25554 12083')
    })

    const walls = nolaeHouse.data.plan.plans.reduce((acc, plan) => {
      acc.push(...plan.murs.map(e => [e.id, e]))
      return acc
    }, [])

    describe.each(walls)(
      'for wall %s',
      (wallId, desc) => {
        let line
        beforeAll(() => {
          line = map.select(`line#wall${wallId}`)
        })
        it('should make a line', () => {
          expect(line).toBeDefined()
          expect(line.empty()).toBeFalsy()
        })

        it.each(['x1', 'x2', 'y1', 'y2'])(
          'should set %s',
          (attr) => {
            expect(line.attr(attr)).toEqual(`${desc[attr]}`)
          }
        )

        it('should set width', () => {
          expect(line.style('stroke-width')).toEqual(`${desc.epais}`)
        })
      }
    )

    const holes = [
      [1, { x1: 647, y1: 2055, x2: 1447, y2: 2052, epais: 250 }],
      [2, { x1: -1381, y1: 2061, x2: -881, y2: 2059, epais: 250 }],
      [3, { x1: 3235, y1: 2047, x2: 3735, y2: 2045, epais: 250 }],
      [4, { x1: 3390, y1: -2288, x2: 2590, y2: -2288, epais: 250 }],
      [5, { x1: -7694, y1: -2390, x2: -7694, y2: -2790, epais: 250 }],
      [6, { x1: 8677, y1: -1970, x2: 8677, y2: -1570, epais: 250 }],
      [7, { x1: 8677, y1: 1357, x2: 8677, y2: 957, epais: 250 }],
      [8, { x1: -2577, y1: 487, x2: -2577, y2: 887, epais: 250 }],
      [9, { x1: -10061, y1: -5968, x2: -10061, y2: -6908, epais: 250 }],
      [10, { x1: -11133, y1: 2065, x2: -10133, y2: 2065, epais: 250 }],
      [11, { x1: -4477, y1: -2084, x2: -4477, y2: -1684, epais: 250 }],
      [12, { x1: -2577, y1: -484, x2: -2577, y2: -84, epais: 250 }],
      [13, { x1: -3207, y1: -4223, x2: -3607, y2: -4223, epais: 250 }],
      [14, { x1: -3373, y1: -2288, x2: -2973, y2: -2288, epais: 250 }],
      [15, { x1: -11636, y1: -835, x2: -11636, y2: -1235, epais: 250 }],
      [16, { x1: 6156, y1: -2288, x2: 6956, y2: -2288, epais: 250 }],
      [17, { x1: 8677, y1: -4041, x2: 8677, y2: -6447, epais: 250 }],
      [18, { x1: 8094, y1: -6768, x2: 4679, y2: -6768, epais: 250 }],
      [19, { x1: -2577, y1: -1306, x2: -2577, y2: -906, epais: 250 }],
      [20, { x1: -725, y1: -2288, x2: -325, y2: -2288, epais: 250 }],
      [21, { x1: 7164, y1: -1177, x2: 6764, y2: -1177, epais: 250 }],
      [22, { x1: -7694, y1: -72, x2: -7694, y2: -472, epais: 250 }],
      [23, { x1: 5452, y1: 2053, x2: 5952, y2: 2057, epais: 250 }],
      [24, { x1: -11633, y1: -3529, x2: -11634, y2: -2529, epais: 250 }],
      [25, { x1: -6970, y1: -3065, x2: -6970, y2: -3465, epais: 250 }],
      [26, { x1: -7694, y1: -1205, x2: -7694, y2: -805, epais: 250 }],
      [27, { x1: -7126, y1: -4223, x2: -7526, y2: -4223, epais: 250 }],
      [28, { x1: 2441, y1: -4323, x2: 3694, y2: -4325, epais: 250 }],
      [29, { x1: -949, y1: -6583, x2: 304, y2: -6583, epais: 250 }],
      [30, { x1: -7147, y1: 3175, x2: -6147, y2: 3175, epais: 250 }],
      [31, { x1: 12427, y1: -1921, x2: 12427, y2: -1121, epais: 250 }],
      [32, { x1: 4358, y1: -6428, x2: 4358, y2: -4743, epais: 250 }],
      [33, { x1: 4358, y1: -1495, x2: 4358, y2: -1895, epais: 250 }],
      [34, { x1: -9157, y1: -8408, x2: -7904, y2: -8408, epais: 250 }],
      [35, { x1: -12627, y1: 175, x2: -12627, y2: 1175, epais: 250 }],
      [36, { x1: -4419, y1: 3175, x2: -3419, y2: 3175, epais: 250 }]
    ]

    describe.each(holes)(
      'for hole %s',
      (wallId, desc) => {
        let line
        beforeAll(() => {
          line = map.select(`line#hole${wallId}`)
        })
        it('should make a line', () => {
          expect(line).toBeDefined()
          expect(line.empty()).toBeFalsy()
        })

        it.each(['x1', 'x2', 'y1', 'y2'])(
          'should set %s',
          (attr) => {
            expect(line.attr(attr)).toEqual(`${desc[attr]}`)
          }
        )

        it('should set width', () => {
          expect(line.style('stroke-width')).toEqual(`${desc.epais}`)
        })
      }
    )

    const rooms = [
      ['Chez Lelouch', { id: 1, walls: '26,25,32,38' }],
      ['Chambre de Maow', { id: 2, walls: '47,20,24,11,34,55' }],
      ['Salle de bain des Minis', { id: 3, walls: '33,23,24,8' }],
      ['Chambre Dood et Mini-Toi', { id: 4, walls: '48,53,2,18,56' }],
      ['Salle de bain de dood et Mimi-Toi', { id: 5, walls: '49,51,18,52' }],
      ['Couloir de Maow', { id: 6, walls: '35,34,64,29,38,39' }],
      ['Couloir de Bleiz', { id: 7, walls: '37,54,61,19,43,64' }],
      ['Salle de Bain', { id: 8, walls: '57,19,27,60' }],
      ['Salon', { id: 9, walls: '26,10,46,5,12,48,3,22,39' }],
      ['Dortoir des minis', { id: 10, walls: '23,11,37,65' }],
      ['Chambre', { id: 11, walls: '63,16,15,54,65' }],
      ['Salle du cube', { id: 12, walls: '29,32,31,27,43' }],
      ['Salle des potions', { id: 13, walls: '60,59,28,62' }],
      ['Salle de jeux', { id: 14, walls: '36,15,61,1,30,66' }],
      ['Chambre de Nolae', { id: 15, walls: '35,22,69,68,21,55' }],
      ['Labo de Bleiz', { id: 16, walls: '44,4,62,57,1,50' }],
      ['Chambre de Brony', { id: 17, walls: '7,45,58,4,28,46' }],
      ['Escalier du cube', { id: 18, walls: '31,25,10,59' }],
      ['Jardin interieur', { id: 20, walls: '13,17,40,6,41,42' }],
      ['Cuisine', { id: 21, walls: '7,5,6,67' }],
      ['Chambre de Luna', { id: 22, walls: '14,70,71,17,9,2,51' }],
      ['Couloir de Luna', { id: 23, walls: '12,53,9,40' }]
    ]

    describe.each(rooms)(
      'for room "%s"',
      (_roomNam, desc) => {
        let path
        beforeAll(() => {
          path = map.select(`path#room${desc.id}`)
        })

        it('should make a path', () => {
          expect(path).toBeDefined()
          expect(path.empty()).toBeFalsy()
        })

        it('should set walls with his walls', () => {
          expect(path.attr('walls')).matchOrder(desc.walls)
        })
      }
    )
  })
})
