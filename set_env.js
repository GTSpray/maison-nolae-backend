const fs = require('fs')
const envSample = fs.readFileSync('.env.sample', { encoding: 'utf8' })
const newLines = []
const regex = /^([a-z_]+)=(.*)$/gim
let m = regex.exec(envSample)
while (m !== null) {
  if (m.index === regex.lastIndex) {
    regex.lastIndex++
  }
  const [, variable, value] = m
  newLines.push(`${variable}=${process.env[variable] || value}`)
  m = regex.exec(envSample)
}
try {
  const content = newLines.join('\n')
  // .replace(/\r\n/gm, "\n")    //normalize
  // .replace(/\n/gm,   "\r\n")  //CR+LF  -  Windows EOL
  fs.writeFileSync('.env', content, { flag: 'w', encoding: 'utf8' })
} catch (err) {
  // An error occurred
  console.error(err)
}
