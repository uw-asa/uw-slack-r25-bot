

'use strict'


const getRoomId = require('./utils/getRoomId')
const r25ws = require('./utils/r25ws')
const querystring = require('querystring')
const processSchedule = require('./utils/processSchedule')
const postSchedule = require('./utils/postSchedule')

module.exports.getTimes = (event, context, callback) => {
  // console.log(event); // Contains incoming request data (e.g., query params, headers and more)
  const payload = querystring.parse(event.body)
  if (payload.token != process.env.SLACK_TOKEN) {
    const response = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        'response_type': 'ephemeral',
        'text': 'Error: unauthorized, token invalid, check app configuration\n'
      })
    }
    callback(null, response)
  } else {
    // check if the room requested is in the list
    //    if so, send good response, else send error and end.
    const queryText = payload.text.trim()
    const roomId = getRoomId
  (queryText)
    if (roomId == null) {
      const response = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          'response_type': 'ephemeral',
          'text': 'Error: incorrect search parameter - did you search for something like "KNE 130"?'
        })
      }
      callback(null, response)
    } else {
      // send OK response, then process times...
      let response = {
        statusCode: 200
        // headers: {
        //   'content-type': 'application/json'
        // },
        // body: JSON.stringify({
        //   'response_type': 'ephemeral',
        //   'text': 'Getting times from R25...'
      }
      callback(null, response)
      r25ws.getTimesForId(roomId, function(results) {
        const scheduleData = processSchedule(results, queryText)
        postSchedule(scheduleData, payload.response_url)
      })
    }
  }
}