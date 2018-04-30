

'use strict'

const querystring = require('querystring')

const r25ws = require('./utils/r25ws')
const processSchedule = require('./utils/r25wsResponseHandler').processSchedule
const processBreaks = require('./utils/r25wsResponseHandler').processBreaks
const parser = require('./utils/parseCommand')
const postData = require('./utils/postData').postData

module.exports.getTimes = (event, context, callback) => {
  // console.log(event); // Contains incoming request data (e.g., query params, headers and more)
  const payload = querystring.parse(event.body)
  if (payload.token != process.env.SLACK_TOKEN) {
    // Fail early if token is incorrect / missing / etc.
    const response = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        'response_type': 'ephemeral',
        'text': 'Error: Unauthorized; token invalid, check app configuration\n'
      })
    }
    console.log('Bad request received with token: ' + payload.token)
    callback(null, response)
  } else {
    // Parse command and return with result to caller 
    const command = parser.parseCommand(payload.text)
    if (command.resolvedCommand == 'ERROR' || command.resolvedCommand == 'HELP') {
      const response = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          'response_type': 'ephemeral',
          'text': command.resolvedCommandText
        })
      }
      callback(null, response)
      if (command.resolvedCommand == 'ERROR') {
        console.log('Error: ' + command.resolvedCommandText)
      }
    } else {
      // send OK response, then process parsed command.
      const response = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          // this should cause the command to be echoed back in channel too.
          'response_type': 'in_channel',
          'text': 'Getting times from R25...'
        })
      }
      callback(null, response)
      r25ws.getTimesForId(command, function (results) {
        var data = null
        if (command.resolvedCommand == 'SCHEDULE') {
          data = processSchedule(results, command)
        } else if (command.resolvedCommand == 'BREAKS') {
          data = processBreaks(results, command)
        } else {
          // error
          console.log('Error: resolvedCommand after getTimesForId failed to parse')
        }
        postData(data, payload.response_url)
      })
    }
  }
}