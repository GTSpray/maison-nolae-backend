const mapService = require('../src/service/map.service')
const archifacile = require('../src/service/loadPlan3.json')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const d3 = require('d3')

describe('archifacile integration', () => {
  const dom = new JSDOM(mapService.getMap())
  const map = d3.select(dom.window.document.querySelector('svg'))

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
    [4, { x1: '7259', y1: '2203', x2: '7259', y2: '803', epais: 250 }]
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
    ['D', { id: 4, walls: '13,14,15,16' }],
    ['A', { id: 5, walls: '1,8,2,21,3,4' }],
    ['E', { id: 7, walls: '17,18,19,20,21' }],
    ['C', { id: 6, walls: '1,5,6,7,2,17,18,22,10,9,12,11,20,3,4' }]
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
