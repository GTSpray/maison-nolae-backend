const chalk = require('chalk')

function serverLog (data, color, type) {
  const d = new Date(Date.now())
  let log = ''
  const message = data.toString().split(/\r?\n/)
  message.forEach((line) => {
    log += `  ${line}\n`
  })
  if (/[0-9A-z]+/.test(log)) {
    console.log(
      `${chalk[color].bold(` ┏ ${type} -------------------`) 
      }\n\n${ 
      log 
      }\n${ 
      chalk[color].bold(` ┗ ${d.toLocaleString()} ------`) 
      }\n`
    )
  }
}
exports.serverLog = serverLog
