const randomInt = (min, max) => {
  const ceilMin = Math.ceil(min)
  const floorMax = Math.floor(max)
  return Math.floor(Math.random() * (floorMax - ceilMin)) + ceilMin
}

const randomStringNumber = (n) =>
  Array.apply(null, Array(n)).map(() => randomInt(0, 9)).join('')

module.exports = {
  randomInt,
  randomStringNumber
}
