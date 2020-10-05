const randomInt = (min, max) => {
  const ceilMin = Math.ceil(min)
  const floorMax = Math.floor(max)
  return Math.floor(Math.random() * (floorMax - ceilMin)) + ceilMin
}

const randomStringNumber = (n) =>
  Array.apply(null, Array(n)).map(() => randomInt(0, 9)).join('')

const permute = (xs) => {
  const ret = []

  for (let i = 0; i < xs.length; i = i + 1) {
    const rest = permute(xs.slice(0, i).concat(xs.slice(i + 1)))

    if (!rest.length) {
      ret.push([xs[i]])
    } else {
      for (let j = 0; j < rest.length; j = j + 1) {
        ret.push([xs[i]].concat(rest[j]))
      }
    }
  }
  return ret
}

module.exports = {
  randomInt,
  randomStringNumber,
  permute
}
