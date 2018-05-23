'use strict'

/* r25wsResponseHandler.js
 * Chase Sawyer
 * University of Washington, 2018
 * 
 * Utility functions for handling the response data from the r25 web service. Processes the data into a format
 * that can be posted to Slack without additional formatting.
 */

// local utilities
const timeStrDiffMin = require('./datetimeUtils').timeStrDiffMin

/**
 * Takes an array of event objects and processes them into a schedule with the name of the event and 
 * the start and end times. The output is in the format of a Slack message where each event is 
 * in an attachment - the order of the results passed is the order in which they are posted (no sorting)
 * @param {Array} results Event objects describing event names, start, and end times. 
 * @param {JSON} command Parsed command info
 * @returns {JSON} Data formatted for posting to Slack.
 */
function processSchedule(results, command) {
  var schedule = [] //list of event describing objects
  const eventCount = results.length
  // console.log(results)
  if (eventCount > 0) {
    results.forEach(function (item) {
      // console.log(item)
      schedule.push({
        'title': item.name,
        'text': '*Start Time:* ' + item.startTime + ' | *End Time:* ' + item.endTime,
        'mrkdwn_in': [ 'text' ]
      })
    })
  } else { //no events
    schedule.push({
      'title': 'Wide open!'
    })
  }
  // console.log(schedule)
  return { //data
    'response_type': 'in_channel',
    'text': 'Events for ' + command.querySpace + ' on ' + command.queryDateStr + ' (' + eventCount + ' events):',
    'attachments': schedule
  }
}

/**
 * Takes a list of events (results) and pivots the data into 3 arrays (titles, start time, end time) which 
 * are then traversed in order to calculate and list the breaks in between the listed events.
 * @param {Array} results Event objects describing event names, start, and end times. 
 * @param {JSON} command Parsed command info
 * @returns {JSON} Data formatted for posting to Slack.
 */
function processBreaks(results, command) {
  var breaks = [] // list of break describing objects
  var nextBreakIndex = null
  var eventTitles = []
  var startTimeStr = []
  var endTimeStr = []
  const eventCount = results.length

  if (eventCount > 0) {
    // process each item into 3 parallel arrays (pivot data)
    results.forEach( function (item) {
      eventTitles.push(item.name)
      startTimeStr.push(item.startTime)
      endTimeStr.push(item.endTime)
    })

    // collect current time for next break determination
    var nowTimeStr = new Date().toLocaleTimeString()
    // console.log('nowtime: ' + nowTimeStr)

    // go through event start and end times to calculate inter-event breaks.
    // this loop could uses two variables to iterate through the lists for clarity.
    for (var s = 1, e = 0; s < startTimeStr.length; s++, e++) {
      var breakLengthMin = timeStrDiffMin(endTimeStr[e], startTimeStr[s])
      var timeToBreakMin = timeStrDiffMin(nowTimeStr, endTimeStr[e])
      if (breakLengthMin > 0) {
        if (timeToBreakMin > 0 && nextBreakIndex === null) {
          // only set the next break index once. The current length before the push below will
          // later become the index to look up after the push.
          // this also changes nextBreakIndex from null to a real value, so it won't be set again.
          nextBreakIndex = breaks.length
        }

        // add each break period to the list of breaks (Slack Attachment format)
        breaks.push({
          'title': 'Break between ' + eventTitles[e] + ' and ' + eventTitles[s],
          'text': endTimeStr[e] + ' to ' + startTimeStr[s] + ' *(' + breakLengthMin + ' mins)*',
          'mrkdwn_in': [ 'text' ]
        })
      }
    }
  } else { // no events = no breaks
    nextBreakIndex = 0 // set in case command asked for next break but there are no events
    breaks.push({
      'title': 'Wide open!'
    })
  }

  // prepare response data
  var responseData = {
    'response_type': 'in_channel'
  }

  if (command.args.allBreaks) {
    responseData['text'] = 'Breaks for ' + command.querySpace
    responseData['attachments'] = breaks
  } else { // not all breaks / allBreaks == false
    if (nextBreakIndex === null) {
      responseData['text'] = 'No further short breaks. Last booking in ' + command.querySpace + ' ends/ended at ' + endTimeStr[endTimeStr.length - 1]
    } else {
      responseData['text'] = 'Next Break for ' + command.querySpace
      let singleBreak = [breaks[nextBreakIndex]] // make an array copy, only keeping the desired break item.
      // console.log('index: ' + nextBreakIndex)
      responseData['attachments'] = singleBreak
    }
  }

  return responseData
}

function processEmpty(command) {
  return {
    'response_type': 'in_channel',
    'text': command.resolvedCommandText
  }
}

module.exports = {
  processSchedule,
  processBreaks,
  processEmpty
}