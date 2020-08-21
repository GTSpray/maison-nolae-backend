const apiContracts = require('../contract.js')

module.exports = {
  contracts: (_req, res) => {
    res.json(apiContracts)
  }
}
