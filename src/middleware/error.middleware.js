module.exports = {
  error: (err, _req, res) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
  }
}
