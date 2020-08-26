const apiContracts = require('../src/contract.js')

describe('TU API contract', () => {
  describe('player', () => {
    const contract = apiContracts.player.properties

    const player = {
      id: 'c28db0a6-99db-41f6-b8a2-3e94c5429eec',
      pseudo: 'valid',
      x: 0,
      y: 0
    }

    describe('should be unvalid', () => {
      ['', 'f', 'fail&', ' fail', 'fail '].forEach((pseudo) => {
        it(`when "${pseudo}" is used as pseudo`, () => {
          const badPlayer = {
            ...player,
            pseudo
          }

          expect(badPlayer).toMismatchApiContract(apiContracts.player, [
            {
              keyword: 'pattern',
              dataPath: '.pseudo',
              schemaPath: '#/properties/pseudo/pattern',
              params: { pattern: contract.pseudo.pattern },
              message: `should match pattern "${contract.pseudo.pattern}"`
            }
          ])
        })
      });

      [
        '',
        'f',
        '',
        'C56A4180-65AA-42EC-A945-5FD21DEC', // (too short)
        '!',
        'x56a4180-h5aa-42ec-a945-5fd21dec0538' // (non-hex characters)
      ].forEach((id) => {
        it(`when "${id}" is used as id`, () => {
          const badPlayer = {
            ...player,
            id
          }
          expect(badPlayer).toMismatchApiContract(apiContracts.player, [
            {
              dataPath: '.id',
              keyword: 'format',
              message: 'should match format "uuid"',
              params: { format: 'uuid' },
              schemaPath: '#/properties/id/format'
            }
          ])
        })
      });

      [-1, 1479, 0.5, '', '1', 'f'].forEach((x) => {
        it(`when "${x}" is used as x`, () => {
          const badPlayer = {
            ...player,
            x
          }
          expect(badPlayer).toMismatchApiContract(apiContracts.player, [
            {
              dataPath: '.x',
              keyword: expect.anything(),
              message: expect.anything(),
              params: expect.anything(),
              schemaPath: expect.anything()
            }
          ])
        })
      });

      [-1, 713, 0.5, '', '1', 'f'].forEach((y) => {
        it(`when "${y}" is used as y`, () => {
          const badPlayer = {
            ...player,
            y
          }
          expect(badPlayer).toMismatchApiContract(apiContracts.player, [
            {
              dataPath: '.y',
              keyword: expect.anything(),
              message: expect.anything(),
              params: expect.anything(),
              schemaPath: expect.anything()
            }
          ])
        })
      })
    })

    describe('should be valid', () => {
      it('when id is not set', () => {
        const p = {
          ...player
        }
        delete p.id

        expect(p).toMatchApiContract(apiContracts.player)
      });

      ['pass', 'pass1', 'pass pass', 'pa'].forEach((pseudo) => {
        it(`when "${pseudo}" is used as pseudo`, () => {
          const p = {
            ...player,
            pseudo
          }
          expect(p).toMatchApiContract(apiContracts.player)
        })
      });

      [0, 1, 1478].forEach((x) => {
        it(`when "${x}" is used as x`, () => {
          const p = {
            ...player,
            x
          }
          expect(p).toMatchApiContract(apiContracts.player)
        })
      });

      [0, 1, 712].forEach((x) => {
        it(`when "${x}" is used as x`, () => {
          const p = {
            ...player,
            x
          }
          expect(p).toMatchApiContract(apiContracts.player)
        })
      });

      ['181ebd01-d0b7-4497-bac4-d59959e3e08b'].forEach((id) => {
        it(`when "${id}" is used as id`, () => {
          const p = {
            ...player,
            id
          }
          expect(p).toMatchApiContract(apiContracts.player)
        })
      })
    })
  })
  describe('event', () => {
    const contract = apiContracts.websocket.properties

    const event = {
      type: 'validtype',
      payload: {
        message: 'valid payload'
      }
    }

    describe('should be valid', () => {
      it('when type is string and payload is an object', () => {
        expect(event).toMatchApiContract(apiContracts.websocket)
      })
    })

    describe('should be invalid', () => {
      [1, {}, null].forEach((type) => {
        it(`when "${type}" is used as type`, () => {
          const badEvent = {
            ...event,
            type
          }
          expect(badEvent).toMismatchApiContract(apiContracts.websocket, [
            {
              dataPath: '.type',
              keyword: 'type',
              message: 'should be string',
              params: {
                type: 'string'
              },
              schemaPath: '#/properties/type/type'
            }
          ])
        })
      })

      it('when undefined is used as type', () => {
        const badEvent = {
          ...event,
          type: undefined
        }
        expect(badEvent).toMismatchApiContract(apiContracts.websocket, [
          {
            dataPath: '',
            keyword: 'required',
            message: "should have required property 'type'",
            params: {
              missingProperty: 'type'
            },
            schemaPath: '#/required'
          }
        ])
      });

      ['', '_', ' ', '. ', '_a'].forEach((type) => {
        it(`when "${type}" is used as type`, () => {
          const badEvent = {
            ...event,
            type
          }
          expect(badEvent).toMismatchApiContract(apiContracts.websocket, [
            {
              dataPath: '.type',
              keyword: 'pattern',
              message: `should match pattern "${contract.type.pattern}"`,
              params: { pattern: contract.type.pattern },
              schemaPath: '#/properties/type/pattern'
            }
          ])
        })
      })
    })
  })

  describe('authentication', () => {
    const contract = apiContracts.authentication.properties

    const authentication = {
      type: 'authentication',
      payload: {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QifQ.z31gNHNwL1V49dzxob6dUackLpNmGCVE9aV9XhaFq7w'
      }
    }

    describe('should be valid', () => {
      it('when type is string and payload is an object', () => {
        expect(authentication.payload).toMatchApiContract(apiContracts.authentication)
      })
    })

    describe('should be unvalid', () => {
      const validToken = authentication.payload.token;
      [
        '...',
        '..',
        '.',
        validToken.replace('.', ''),
        ...validToken.split('.').reduce((acc, e) => {
          acc.push(validToken.replace(e, ''))
          return acc
        }, [])
      ].forEach((token) => {
        it(`when "${token}" is used as token`, () => {
          expect({ token }).toMismatchApiContract(apiContracts.authentication, [
            {
              dataPath: '.token',
              keyword: 'pattern',
              message: `should match pattern "${contract.token.pattern}"`,
              params: { pattern: contract.token.pattern },
              schemaPath: '#/properties/token/pattern'
            }
          ])
        })
      })
    })
  })
})
