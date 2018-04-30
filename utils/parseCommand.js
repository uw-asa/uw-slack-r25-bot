/* helpful module for parsing out the received command, and helping the main handler
  function decide what to do and what to return to slack/client.
  Possible command types are some flavor of:
    - help
    - get schedule
    - get breaks
*/
const getRoomId = require('./getRoomId')
const responseText = require('./responseText.json') // long blobs of static text to be returned to the user
const getDateStrFromDayDelta = require('./datetimeUtils').getDateStrFromDayDelta

function parseCommand(queryText) {
  queryText = queryText.trim().toUpperCase()
  //TODO: refactor 'command' into an object for easier use elsewhere
  var command = {
    elements: null,
    numberOfElements: null,
    resolvedCommand: null,
    resolvedCommandText: null,
    querySpace: null,
    queryDateStr: null,
    roomId: null,
    args: {
      dayDeltaStr: null,
      allBreaks: true
    }
  }

  command.elements = queryText.split(/\s+/)
  command.numberOfElements = command.elements.length

  if (command.numberOfElements < 2 && command.elements[0] == 'HELP') {
    command.resolvedCommand = 'HELP'
    command.resolvedCommandText = responseText.text['HELP']

  } else if (command.numberOfElements >= 2) {
    command.querySpace = command.elements[0] + ' ' + command.elements[1]
    command.roomId = getRoomId(command.querySpace)
    command.resolvedCommand = 'SCHEDULE'
    command.queryDateStr = new Date().toLocaleDateString('en-US')

    if (command.roomId == null) {
      command.resolvedCommand = 'ERROR'
      command.resolvedCommandText = responseText.text['ERROR-ROOM-QUERY']

    } else if (command.numberOfElements > 2 && command.elements[2].length >= 2) {
      /* possible extended commands: 
        ...['breaks'] == show all breaks
        ...['next break'] == show the next break only
        ...['tomorrow'] == special - give tomorrow's times
        ...['+1' | '+2' | etc.] == day delta
        TODO: ...['02/13/2018'] -- parse and find actual date
      */
      if (command.elements[2] == 'TOMORROW') {
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