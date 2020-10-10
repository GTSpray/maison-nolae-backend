const { permute } = require('./helpers/random.helper')
const { invertWall } = require('./helpers/map.help')

const mapService = require('../src/service/map.service')
const { MapParser } = require('../src/service/map.service')

const archifacile = require('./mockdatas/testing-plan.json')
const nolaeHouse = require('./mockdatas/nolae-house.json')

describe('archifacile integration', () => {
  describe('Path', () => {
    const wallList = [
      { x1: 0, y1: 0, x2: 0, y2: 1 },
      { x1: 0, y1: 1, x2: 1, y2: 1 },
      { x1: 1, y1: 1, x2: 1, y2: 0 },
      { x1: 1, y1: 0, x2: 0, y2: 0 }
    ].map((e, i) => ({
      id: i + 1,
      p1: `x:${e.x1} y:${e.y1}`,
      p2: `x:${e.x2} y:${e.y2}`,
      ...e
    }))

    describe('resolveInverted', () => {
      let walls
      let path
      beforeEach(() => {
        walls = wallList.map(wall => ({
          ...wall
        }))

        path = new mapService.Path([])
        jest.spyOn(path, 'invert')
      })

      it('should not invert wall when all of them have next', () => {
        path.resolveInverted(walls)
        expect(path.invert).toHaveBeenCalledTimes(0)
      })

      const cases1Inverted = [
        0,
        1,
        2
        // 3 // 3 times
      ]
      it.each(cases1Inverted)(
        'should resolve path with %s has inverted wall',
        (iWall) => {
          invertWall(walls[iWall])

          path.resolveInverted(walls)

          expect(path.invert).toHaveBeenCalledTimes(1)
        }
      )

      const cases2Inverteds = [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        // [1, 3], // 4 times
        [2, 3]
      ]
      it.each(cases2Inverteds)(
        'should resolve path with %s and %s has inverteds walls',
        (iWall1, iWall2) => {
          invertWall(walls[iWall1])
          invertWall(walls[iWall2])

          path.resolveInverted(walls)

          expect(path.invert).toHaveBeenCalledTimes(2)
        }
      )

      const cases3Inverteds = [
        // [ 1, 2, 3 ], // 1 time
        [0, 2, 3],
        [0, 1, 3],
        [0, 1, 2]
      ]
      it.each(cases3Inverteds)(
        'should resolve path with [%s,%s,%s] has inverteds wall',
        (iWall1, iWall2, iWall3) => {
          invertWall(walls[iWall1])
          invertWall(walls[iWall2])
          invertWall(walls[iWall3])

          path.resolveInverted(walls)

          expect(path.invert).toHaveBeenCalledTimes(3)
        }
      )

      const infiniteCases = [
        { x1: -1, y1: -1, x2: -1, y2: -1 }, // out of path
        { x1: 1, y1: 0, x2: -1, y2: -1 } // same origin
      ].map((e, i) => ({
        id: wallList.length + i + 1,
        p1: `x:${e.x1} y:${e.y1}`,
        p2: `x:${e.x2} y:${e.y2}`,
        ...e
      }))
      it.each(infiniteCases)(
        'should prevent infinite loop when a wall is not connected to others',
        (dangerousWall) => {
          walls.push(dangerousWall)

          path.resolveInverted(walls)

          expect(path.invert).toHaveBeenCalledTimes(5)
        })
    })

    describe('resolveSorting', () => {
      const expectedOrder = wallList.map((e) => e.id).join(',')
      const permutations = permute(wallList.map(e => e.id)).map(e => e.join(','))
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
            const path = new mapService.Path([])
            const resolveds = path.resolveSorting(walls)
            const wallOrder = resolveds.map(e => e.id).join(',')
            expect(wallOrder).matchWallSorting(expectedOrder)
          })
        }
      )
    })

    describe('isNext', () => {
      const walls = [
        { x1: 0, y1: 0, x2: 0, y2: 1 },
        { x1: 0, y1: 1, x2: 1, y2: 1 },
        { x1: 1, y1: 1, x2: 1, y2: 0 }
      ].map((e, i) => ({
        id: i + 1,
        p1: `x:${e.x1} y:${e.y1}`,
        p2: `x:${e.x2} y:${e.y2}`,
        ...e
      }))

      const path = new mapService.Path([])

      it('should return true when a.p1 is same as b.p2 ', () => {
        expect(path.isNext(walls[1], walls[0])).toBe(true)
      })

      it('should return false when a and b are same wall ', () => {
        expect(path.isNext(walls[0], walls[0])).toBe(false)
      })

      it('should return true when a.p1 and b.p2 are different ', () => {
        expect(path.isNext(walls[2], walls[0])).toBe(false)
      })
    })

    describe('isPrev', () => {
      it('should call path.isNext with his arguments inverted', () => {
        const path = new mapService.Path([])

        const a = 'a'
        const b = 'b'
        const isNextReturn = ''

        jest.spyOn(path, 'isNext').mockReturnValue(isNextReturn)

        const ret = path.isPrev(a, b)

        expect(path.isNext).toHaveBeenCalledTimes(1)
        expect(path.isNext).toHaveBeenCalledWith(b, a)
        expect(ret).toEqual(isNextReturn)
      })
    })

    describe('invert', () => {
      const path = new mapService.Path([])
      const wall = {
        id: 'valueOf_id',
        x1: 'valueOf_x1',
        y1: 'valueOf_y1',
        x2: 'valueOf_x2',
        y2: 'valueOf_y2',
        p1: 'valueOf_p1',
        p2: 'valueOf_p2'
      }

      const cases = [
        ['x1', 'x2'],
        ['y1', 'y2'],
        ['p1', 'p2']
      ]

      it.each(cases)(
        'should invert %s and %s attribute',
        (attr1, attr2) => {
          const wallCopy = { ...wall }

          const attr1Before = wallCopy[attr1]
          const attr2Before = wallCopy[attr2]

          const ret = path.invert(wallCopy)

          expect(attr1Before).not.toEqual(attr2Before)
          expect(wallCopy[attr1]).toEqual(attr2Before)
          expect(wallCopy[attr2]).toEqual(attr1Before)
          expect(ret).toBe(wallCopy)
        }
      )
    })

    describe('isSameOrigin', () => {
      const walls = [
        { x1: 0, y1: 0, x2: 0, y2: 1 },
        { x1: 0, y1: 0, x2: 0, y2: 1 },
        { x1: 0, y1: 1, x2: 1, y2: 1 }
      ].map((e, i) => ({
        id: i + 1,
        p1: `x:${e.x1} y:${e.y1}`,
        p2: `x:${e.x2} y:${e.y2}`,
        ...e
      }))

      const path = new mapService.Path([])

      it('should return true when a.p1 is same as b.p1 ', () => {
        expect(path.isSameOrigin(walls[1], walls[0])).toBe(true)
      })

      it('should return false when a and b are same wall ', () => {
        expect(path.isSameOrigin(walls[0], walls[0])).toBe(false)
      })

      it('should return true when a.p1 and b.p1 are different ', () => {
        expect(path.isSameOrigin(walls[2], walls[0])).toBe(false)
      })
    })

    describe('getPath', () => {
      const cases = wallList.map(e => e.id)

      const path = new mapService.Path([])
      path.walls = wallList.map((e, i) => ({
        id: e.id,
        x1: e.x1 * i,
        x2: e.x2 * i,
        y1: e.y1 * i,
        y2: e.y2 * i
      }))

      describe.each(cases)(
        'for wall %s',
        (wallId) => {
          let wall, ret
          beforeEach(() => {
            wall = path.walls.find(e => e.id === wallId)
            ret = path.getPath()
          })

          it('should return array containing his p1', () => {
            expect(ret).toContainEqual({ x: wall.x1, y: wall.y1 })
          })

          it('should return array containing his p2', () => {
            expect(ret).toContainEqual({ x: wall.x2, y: wall.y2 })
          })
        }
      )
    })
  })

  describe('Testing plan', () => {
    const parser = new MapParser(archifacile)
    parser.parse()

    it('should set viewbox of map boudaries', () => {
      expect(parser.svg.attr('viewBox')).toEqual('-3668 -3122 19884 18252')
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
          line = parser.svg.select(`line#wall${wallId}`)
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
          line = parser.svg.select(`line#hole${wallId}`)
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
          path = parser.svg.select(`path#room${desc.id}`)
        })

        it('should make a path', () => {
          expect(path).toBeDefined()
          expect(path.empty()).toBeFalsy()
        })

        it('should set walls with his walls', () => {
          expect(path.attr('walls')).matchWallSorting(desc.walls)
        })
      }
    )
  })

  describe('Nolae\'s house plan', () => {
    const parser = new MapParser(nolaeHouse)
    parser.parse()

    it('should set viewbox of map boudaries', () => {
      expect(parser.svg.attr('viewBox')).toEqual('-12877 -8658 25554 12083')
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
          line = parser.svg.select(`line#wall${wallId}`)
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
      [2, { x1: -1381, y1: 2061, x2: -881, y2: 2060, epais: 250 }],
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
      [28, { x1: 2441, y1: -4323, x2: 3694, y2: -4324, epais: 250 }],
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
          line = parser.svg.select(`line#hole${wallId}`)
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
          path = parser.svg.select(`path#room${desc.id}`)
        })

        it('should make a path', () => {
          expect(path).toBeDefined()
          expect(path.empty()).toBeFalsy()
        })

        it('should set walls with his walls', () => {
          expect(path.attr('walls')).matchWallSorting(desc.walls)
        })
      }
    )
  })
})
