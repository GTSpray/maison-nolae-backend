const getRandomInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

const randomStringNumber = () =>
  [...'xxxxx'].map(() => getRandomInt(0, 9)).join('')

module.exports = {
  getRandomInt,
  randomStringNumber
}
