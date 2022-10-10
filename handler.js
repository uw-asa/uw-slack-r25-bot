'use strict'

/* AWS Lambda function handler.js
 * Chase Sawyer
 * University of Washington, 2018-2022
 * 
 * Defines two Lambda functions that make up two halves of the UW-SlackR25Bot slash command, '/r25'.
 * The parse handler parses an incoming Slack slash command through the AWS Gateway, and processes/validates
 * it. The parse handler ends with a confirmation to Slack that the command was received/processed, and if
 * the command is valid, will fire off a SNS message that will trigger the second Lambda function.
 * The getTimes handler is triggered by the SNS message and takes the processed JSON command and response 
 * URL in it's event parameter. It fires off a function to the r25ws function which contacts the web service
 * to fulfill the command. The results from the R25 web service are then handed to a post-processing utility
 * in r25wsResponseHandler.js which will look through the results and give back formatted JSON for the handler
 * function here to pass back to Slack via postData().
 * 
 * Console is used to log data to AWS CloudWatch by default.
 */

// Node/Libraries
const querystring = require('querystring')
const SNS = require('aws-sdk/clients/sns')

// Local Utilities
const r25ws = require('./utils/r25ws')
const responseHandler = require('./utils/r25wsResponseHandler')
const parser = require('./utils/parseCommand')
const postData = require('./utils/postData').postData
const responseText = require('./utils/responseText.json')

/**
 * AWS Lambda handler function implementation.
 * Validates and Parses the incoming command from the AWS Gateway. Checks for the presence and 
 * validity of the included Slack Token, returning an error if the token doesn't match.
 * Once the command is parsed, this function either returns the appropriate parse error info, 
 * help text, or confirmation to the client before firing an SNS notification with the command
 * to the other Lambda function handler (getTimes()).
 * For Slack slash commands, all responses, including errors, should have status code 200 in order
 * to post relevant response information to the user.
 * @param {JSON} event Received data to Lambda function
 * @param {JSON} context AWS Lambda function info (such as execution time)
 * @param {function} callback Endpoint to call when execution complete.
 */
function parse(event, context, callback) {
  // console.log(event); // Contains incoming request data (e.g., query params, headers and more)
  const payload = querystring.parse(event.body)
  console.log('Received Command: ' + JSON.stringify(payload))

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
    console.log('Bad request received with token: \'' + payload.token + '\'')
    callback(null, response)

  } else { // TOKEN OK.
    // Parse command
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
      // OK. Send SNS message with parsed command to start 2nd part of process with separate Lambda function,
      // and send back acknowledgement back to slack user that command is progressing.
      var slackResponse = {
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
      // pack up parsed command and response URL for getTimes() handler
      var snsParams = {
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: JSON.stringify({
          'response_url': payload.response_url,
          'command': command
        })
      }
      snsClient.publish(snsParams, function(err, data) {
        if (err) {
          console.log(err, err.stack) // an error occurred
          slackResponse.body = JSON.stringify({
            'response_type': 'ephemeral',
            'text': 'Looks like I can\'t process your request right now. [Error logged]'
          })
          callback(null, slackResponse)
        } else{
          console.log('SNS Publish Success: ' + data) // successful response
          callback(null, slackResponse)
        }
      })
    }
  }
}

/**
 * AWS Lambda handler function implementation.
 * Triggered by ingest of SNS notification from parse handler. Unpacks command object and response URL to 
 * return data to Slack via from the SNS message, then uses that info to call the R25 web service and get 
 * the needed data. Takes the raw data from the R25 web service and calls helpers to process it before 
 * it gets sent back to Slack.
 * @param {JSON} event Received data to Lambda function
 * @param {JSON} context AWS Lambda function info (such as execution time)
 * @param {function} callback Endpoint to call when execution complete.
 */
function getTimes(event, context, callback) {
  //get the command and response url from the incoming message from SNS
  const messageJson = JSON.parse(event.Records[0].Sns.Message)
  var command = messageJson.command
  const response_url = messageJson.response_url
  // console.log('RECEIVED DATA: (DEBUG)')
  // console.log('MESSAGE:' + event.Records[0].Sns.Message)
  // console.log('COMMAND:' + JSON.stringify(command))
  // console.log('SPACEID:' + command.roomId)
  // console.log('URL:' + response_url)
  // console.log('END RECEIVED DATA DEBUG')
  callback(null, { statusCode: 200 })
  r25ws.getTimesForId(command, function (results) {
    var data = null
    if (results === null) {
      console.log('Error//handler: Results came back null')
      command.resolvedCommandText = responseText.text['ERROR-R25WS-DOWN']
      data = responseHandler.processEmpty(command)
    } else {
      // Here's where processor utilities get called based on the determined command
      if (command.resolvedCommand == 'SCHEDULE') {
        data = responseHandler.processSchedule(results, command)
      } else if (command.resolvedCommand == 'BREAKS') {
        data = responseHandler.processBreaks(results, command)
      } else {
        // error
        console.log('Error: resolvedCommand after getTimesForId failed to parse')
      }
    }
    postData(data, response_url)
  })
}

module.exports = {
  parse,
  getTimes
}