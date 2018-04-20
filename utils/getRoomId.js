
const spacesJson = require('./spaces.json')

function getRoomId(roomQuery) {
  // console.log(spacesJson)
  if (typeof roomQuery === 'string') {
    roomQuery = roomQuery.toUpperCase()
    if (roomQuery in spacesJson.list) {
      return spacesJson.list[roomQuery]
    }
  }
  return null
}

module.exports = getRoomId