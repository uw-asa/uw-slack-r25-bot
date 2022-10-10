'use strict'

/* parseCommand.js
 * Chase Sawyer
 * University of Washington, 2018-2022
 * Helpful module for parsing out the received command, and helping the main handler
 * function decide what to do and what to return to slack/client.
 * Possible command types are some flavor of:
 *  - help
 *  - get schedule
 *  - get breaks
 */
const getRoomId = require('./getRoomId')
const responseText = require('./responseText.json') // long blobs of static text to be returned to the user
const getDateStrFromDayDelta = require('./datetimeUtils').getDateStrFromDayDelta

/**
 * Parses received command string, and returns a command object with the parsed parameters in a structured
 * format.
 * @param {String} queryText Query string received from Slack, case insensitive.
 * @return {JSON object} command JSON with the following properties:
 *  - elements: String array of whitespace separated query parameters
 *  - numberOfElements: Number equal to elements.length()
 *  - resolvedCommand: String - one of: 'HELP', 'ERROR', 'SCHEDULE', or 'BREAKS'
 *  - resolvedCommandText: String - holds 'HELP' or 'ERROR' text to return to user
 *  - querySpace: String - Building and room number as a string if a space can be resolved. Null otherwise.
 *  - queryDateStr: String - Date string for the requested query date (see dayDeltaStr)
 *  - roomId: String - r25ws space ID to query if querySpace can be resolved. Null otherwise.
 *  - args: JSON containing:
 *    - dayDeltaStr: String - the '+{number}' offset for the query. '+1' or greater. Null for non-offset date.
 *    - allBreaks: Boolean - only false if command was for 'NEXT BREAK'
 *    - limitNow: Boolean - only true if command was for 'NOW'
 */
function parseCommand(queryText) {
  // Clean up the query text, and make it all uppercase for easy matching
  queryText = queryText.trim().toUpperCase()

  const command = {
    elements: null,
    numberOfElements: null,
    resolvedCommand: null,
    resolvedCommandText: null,
    querySpace: null,
    queryDateStr: null,
    roomId: null,
    args: {
      dayDeltaStr: null,
      allBreaks: true,
      limitNow: false
    }
  }

  command.elements = queryText.split(/\s+/) // splits on one or more spaces
  command.numberOfElements = command.elements.length

  if (command.numberOfElements < 2 && command.elements[0] == 'HELP') {
    command.resolvedCommand = 'HELP'
    command.resolvedCommandText = responseText.text['HELP']

  } else if (command.numberOfElements >= 2) {
    command.querySpace = command.elements[0] + ' ' + command.elements[1]
    command.roomId = getRoomId(command.querySpace)
    command.resolvedCommand = 'SCHEDULE'
    command.queryDateStr = new Date().toLocaleDateString('en-US')

    if (command.roomId === null) {
      command.resolvedCommand = 'ERROR'
      command.resolvedCommandText = responseText.text['ERROR-ROOM-QUERY']

    } else if (command.numberOfElements > 2 && command.elements[2].length >= 2) {
      /* possible extended commands:
        ...['now'] == just show what's happening now
        ...['breaks'] == show all breaks
        ...['next break'] == show the next break only
        ...['tomorrow'] == special: give tomorrow's times by converting to day delta
        ...['+1' | '+2' | etc.] == day delta
        TODO: ...['02/13/2018'] -- parse and find actual date
      */
      if (command.elements[2] == 'NOW') {
        command.args.limitNow = true

      } else if (command.elements[2] == 'TOMORROW') {
        command.args.dayDeltaStr = '+1'
        command.queryDateStr = getDateStrFromDayDelta(command.args.dayDeltaStr)
        
      } else if (command.elements[2][0] == '+' && !isNaN(parseInt(command.elements[2].slice(1)))) {
        command.args.dayDeltaStr = command.elements[2]
        command.queryDateStr = getDateStrFromDayDelta(command.args.dayDeltaStr)

      } else if (command.elements[2] == 'BREAKS' || command.elements[2] == 'NEXT') {
        command.resolvedCommand = 'BREAKS'
        if (command.elements[2] == 'NEXT' && command.numberOfElements >= 4 && command.elements[3] == 'BREAK') {
          command.args.allBreaks = false
        }
      } else {
        // wasn't able to parse extended command
        command.resolvedCommand = 'ERROR'
        command.resolvedCommandText = responseText.text['ERROR-EXTENDED-COMMAND']
      }
    }
  } else {
    // short command, wasn't for help
    command.resolvedCommand = 'ERROR'
    command.resolvedCommandText = responseText.text['ERROR-GENERIC']
  }

  return command
}

module.exports = {
  parseCommand
}