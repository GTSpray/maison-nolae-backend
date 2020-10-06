const invertAttr = (a, attr1, attr2) => {
  const v1 = a[attr1]
  const v2 = a[attr2]

  a[attr1] = v2
  a[attr2] = v1
}

const invertWall = (w) => {
  invertAttr(w, 'x1', 'x2')
  invertAttr(w, 'y1', 'y2')
  invertAttr(w, 'p1', 'p2')
  return w
}

module.exports = {
  invertAttr,
  invertWall
}
