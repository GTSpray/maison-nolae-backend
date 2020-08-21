const getRandomInt = (min, max) => {
  const ceilmin = Math.ceil(min)
  const floormax = Math.floor(max)
  return Math.floor(Math.random() * (floormax - ceilmin)) + ceilmin
}

const randomStringNumber = () =>
  [...'xxxxx'].map(() => getRandomInt(0, 9)).join('')

module.exports = {
  getRandomInt,
  randomStringNumber
}
