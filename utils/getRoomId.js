'use strict'

/* getRoomId.js
 * Chase Sawyer
 * University of Washington, 2018
 * 
 * Helper module that matches the room query against a listing of rooms to
 * return a space ID from the lookup table.
 */

const spacesJson = require('./spaces.json')

/**
 * Takes a string and returns an ID if it is found in the spaces list.
 * Rerturns null if the query was not in the room list.
 * @param {String} roomQuery Building code / room number 
 */
function getRoomId(roomQuery) {
  // console.log(spacesJson)
  if (typeof roomQuery === 'string') {
    roomQuery = roomQuery.toUpperCase()
    if (roomQuery in spacesJson.list) {
      return spacesJson.list[roomQuery]
    }
  }
  // roomQuery didn't resolve.
  return null
}

module.exports = getRoomId