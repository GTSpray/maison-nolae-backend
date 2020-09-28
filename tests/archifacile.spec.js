const mapService = require('../src/service/map.service')
const archifacile = require('../src/service/loadPlan3.json')
const nolaeHouse = require('../src/service/loadPlan.json')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const d3 = require('d3')

describe('archifacile integration', () => {
  describe('testing plan', () => {
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
      ['B', { id: 1, walls: '5,6,7,8' }],
      ['D', { id: 3, walls: '13,14,15,16' }],
      ['A', { id: 4, walls: '1,8,2,21,3,4' }],
      ['E', { id: 6, walls: '17,18,19,20,21' }],
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

  describe('Nolae\'s house', () => {
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
      [1, { x1: '647', y1: '2055', x2: '1447', y2: '2052', epais: 250 }]
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
      ['Chez Lelouch', { id: 1, walls: '25,32,38,26' }],
      ['Chambre de Maow', { id: 2, walls: '11,34,55,47,20,24' }],
      ['Salle de bain des Minis', { id: 3, walls: '8,24,23,33' }],
      ['Chambre Dood et Mini-Toi', { id: 4, walls: '2,18,56,48,53' }],
      // ['Salle de bain de dood et Mimi-Toi', { id: 5, walls: '18,51,49,52, ' }],
      ['Couloir de Maow', { id: 6, walls: '29,38,39,35,34,64' }],
      ['Couloir de Bleiz', { id: 7, walls: '19,43,64,37,54,61' }],
      // ['Salle de Bain', { id: 8, walls: '19,27,60,57, ' }],
      ['Salon', { id: 9, walls: '3,22,39,26,10,46,5,12,48' }],
      ['Dortoir des minis', { id: 10, walls: '11,37,65,23' }],
      ['Chambre', { id: 11, walls: '15,54,65,63,16' }],
      ['Salle du cube', { id: 12, walls: '27,43,29,32,31' }],
      // ['Salle des potions', { id: 13, walls: '28,59,60,62, ' }],
      ['Salle de jeux', { id: 14, walls: '1,30,66,36,15,61' }],
      ['Chambre de Nolae', { id: 15, walls: '21,55,35,22,69,68' }],
      ['Labo de Bleiz', { id: 16, walls: '1,50,44,4,62,57' }],
      ['Chambre de Brony', { id: 17, walls: '4,28,46,7,45,58' }],
      ['Escalier du cube', { id: 18, walls: '10,59,31,25' }],
      ['Jardin interieur', { id: 20, walls: '6,41,42,13,17,40' }],
      ['Cuisine', { id: 21, walls: '5,6,67,7' }],
      ['Chambre de Luna', { id: 22, walls: '2,51,14,70,71,17,9' }],
      ['Couloir de Luna', { id: 23, walls: '9,40,12,53' }]
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
          expect(path.attr('walls')).toEqual(desc.walls)
        })
      }
    )
  })
})
