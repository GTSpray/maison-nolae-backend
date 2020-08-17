module.exports = {
  player: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: ["string", "null"], format: "uuid" },
      pseudo: {
        type: "string",
        pattern: "^(?:[a-zA-Z0-9]+[ ]?[a-zA-Z0-9]+)+$"
      },
      x: { type: "integer", minimum: 0, maximum: 1478 },
      y: { type: "integer", minimum: 0, maximum: 712 }
    }
  },
  websocket: {
    type: "object",
    additionalProperties: false,
    properties: {
      type: { type: "string", pattern: "^[a-z]+$" },
      payload: {
        type: "object"
      }
    },
    required: ["type", "payload"]
  },
  authenticate: {
    type: "object",
    additionalProperties: false,
    properties: {
      token: {
        type: "string",
        pattern: "^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$"
      }
    }
  }
};
