const Ajv = require("ajv");
const apiContracts = require("../contract.js");

const ajv = Ajv({ allErrors: true });
describe("API contract", () => {
  describe("player", () => {
    const validatePlayer = ajv.compile(apiContracts.player);
    const contract = apiContracts.player.properties;

    const player = {
      id: "c28db0a6-99db-41f6-b8a2-3e94c5429eec",
      pseudo: "valid",
      x: 0,
      y: 0
    };

    describe("should be unvalid", () => {
      ["", "f", "fail&", " fail", "fail "].forEach((pseudo) => {
        it(`when "${pseudo}" is used as pseudo`, () => {
          const valid = validatePlayer({
            ...player,
            pseudo
          });
          expect(valid).toBe(false);
          expect(validatePlayer.errors).toEqual([
            {
              dataPath: ".pseudo",
              keyword: "pattern",
              message: `should match pattern "${contract.pseudo.pattern}"`,
              params: { pattern: contract.pseudo.pattern },
              schemaPath: "#/properties/pseudo/pattern"
            }
          ]);
        });
      });

      [
        "",
        "f",
        "",
        "C56A4180-65AA-42EC-A945-5FD21DEC", // (too short)
        "!",
        "x56a4180-h5aa-42ec-a945-5fd21dec0538" // (non-hex characters)
      ].forEach((id) => {
        it(`when "${id}" is used as id`, () => {
          const valid = validatePlayer({
            ...player,
            id
          });
          expect(valid).toBe(false);
          expect(validatePlayer.errors).toEqual([
            {
              dataPath: ".id",
              keyword: "format",
              message: 'should match format "uuid"',
              params: { format: "uuid" },
              schemaPath: "#/properties/id/format"
            }
          ]);
        });
      });

      [-1, 1479, 0.5, "", "1", "f"].forEach((x) => {
        it(`when "${x}" is used as x`, () => {
          const valid = validatePlayer({
            ...player,
            x
          });
          expect(valid).toBe(false);
          expect(validatePlayer.errors.length).toBe(1);
          expect(validatePlayer.errors[0].dataPath).toBe(".x");
        });
      });

      [-1, 713, 0.5, "", "1", "f"].forEach((y) => {
        it(`when "${y}" is used as y`, () => {
          const valid = validatePlayer({
            ...player,
            y
          });
          expect(valid).toBe(false);
          expect(validatePlayer.errors.length).toBe(1);
          expect(validatePlayer.errors[0].dataPath).toBe(".y");
        });
      });
    });

    describe("should be valid", () => {
      it("when id is not set", () => {
        const p = {
          ...player
        };
        delete p.id;

        const valid = validatePlayer(p);
        expect(valid).toBe(true);
      });

      ["pass", "pass1", "pass pass", "pa"].forEach((pseudo) => {
        it(`when "${pseudo}" is used as pseudo`, () => {
          const valid = validatePlayer({
            ...player,
            pseudo
          });
          expect(valid).toBe(true);
        });
      });

      [0, 1, 1478].forEach((x) => {
        it(`when "${x}" is used as x`, () => {
          const valid = validatePlayer({
            ...player,
            x
          });
          expect(valid).toBe(true);
        });
      });

      [0, 1, 712].forEach((x) => {
        it(`when "${x}" is used as x`, () => {
          const valid = validatePlayer({
            ...player,
            x
          });
          expect(valid).toBe(true);
        });
      });

      ["181ebd01-d0b7-4497-bac4-d59959e3e08b"].forEach((id) => {
        it(`when "${id}" is used as id`, () => {
          const valid = validatePlayer({
            ...player,
            id
          });
          expect(valid).toBe(true);
        });
      });
    });
  });
});
