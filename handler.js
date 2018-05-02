

'use strict'

const querystring = require('querystring')
const SNS = require('aws-sdk/clients/sns')

const r25ws = require('./utils/r25ws')
const processSchedule = require('./utils/r25wsResponseHandler').processSchedule
const processBreaks = require('./utils/r25wsResponseHandler').processBreaks
const parser = require('./utils/parseCommand')
const postData = require('./utils/postData').postData

function parse(event, context, callback) {
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
    var command = parser.parseCommand(payload.text)
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
      const slackResponse = {
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

      var snsClient = new SNS()
      var snsParams = {
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: {
          'default': {
            'response_url': payload.response_url,
            'command': command
          }
        },
        MessageStructure: 'json'
      }
      snsClient.publish(snsParams, function(err, data) {
        if (err) {
          console.log(err, err.stack) // an error occurred
        } else{
          console.log(data)          // successful response
          callback(null, slackResponse)
        }
      })
    }
  }
}

function getTimes(event, context, callback) {
  //get the command and response url from the incoming message from SNS
  var command = event.Records[0].Sns.Message.command
  const response_url = event.Records[0].Sns.Message.response_url
  console.log('RECEIVED DATA: (DEBUG)')
  console.log(event)
  console.log(command)
  console.log(response_url)
  console.log('END RECEIVED DATA DEBUG')
  callback(null, { statusCode: 200 })
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
    postData(data, response_url)
  })
}

module.exports = {
  parse,
  getTimes
}