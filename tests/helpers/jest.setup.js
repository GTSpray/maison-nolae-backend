const jose = require('jose')
const Ajv = require('ajv')
expect.extend({
  toMatchApiContract (body, schema) {
    const ajv = new Ajv()
    const validate = ajv.compile(schema)
    const pass = !!validate(body)
    return {
      message: () => (pass ? '' : JSON.stringify(validate.errors[0], null, 2)),
      pass
    }
  },
  toMismatchApiContract (body, schema, expectedErrors) {
    const ajv = new Ajv()
    const validate = ajv.compile(schema)

    let msg = ''
    if (validate(body)) {
      msg = `expected ${JSON.stringify(
        body,
        null,
        2
      )} do not match with contract`
    } else if (!this.equals(validate.errors, expectedErrors)) {
      msg = `expected ${JSON.stringify(
        validate.errors,
        null,
        2
      )} to be ${JSON.stringify(expectedErrors, null, 2)}`
    }

    return {
      message: () => msg,
      pass: msg === ''
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
