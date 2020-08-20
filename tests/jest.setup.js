const jose = require('jose')
const Ajv = require('ajv')
expect.extend({
  toMatchApiContract (body, schema) {
    const apiContract = new Ajv().addSchema(schema, 'apicontract')
    const pass = !!apiContract.validate('apicontract', body)
    return {
      message: () => (pass ? '' : apiContract.errorsText(apiContract.errors)),
      pass
    }
  },
  toMatchJWT (token, expectedPayload) {
    const payload = jose.JWT.decode(token)
    return {
      message: () =>
        `expected ${JSON.stringify(
          payload,
          null,
          2
        )} JWT token contain ${JSON.stringify(expectedPayload, null, 2)}`,
      pass: this.equals(payload, expect.objectContaining(expectedPayload))
    }
  }
})
