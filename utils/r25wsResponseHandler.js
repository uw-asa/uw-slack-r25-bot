'use strict'

/* r25wsResponseHandler.js
 * Chase Sawyer
 * University of Washington, 2018-2022
 * 
 * Utility functions for handling the response data from the r25 web service. Processes the data into a format
 * that can be posted to Slack without additional formatting.
 */

// local utilities
const {
  timeStrDiffMin,
  LOCALE,
  LOCALE_OPTIONS,
} = require('./datetimeUtils')

/**
 * Helper function that takes two times and marks them up for insertion into a slack message
 * @param {String} startT start time string
 * @param {String} endT end time string
 * @returns markdown formatted string for Slack
 */
function startEndTimeFmt(startT, endT) {
  return `*Start Time:* ${startT} | *End Time:* ${endT}`
}

/**
 * Takes an array of event objects and processes them into a schedule with the name of the event and 
 * the start and end times. The output is in the format of a Slack message where each event is 
 * in an attachment - the order of the results passed is the order in which they are posted (no sorting).
 * *It is assumed* that the results are pre-sorted.
 * Will also take into account the "NOW" command and return only what's happening at the time of the request.
 * @param {Array} results Event objects describing event names, start, and end times. 
 * @param {JSON} command Parsed command info
 * @returns {JSON} Data formatted for posting to Slack.
 */
function processSchedule(results, command) {
  var schedule = [] //list of event describing objects
  let overallReplyText = ''
  const eventCount = results.length
  // console.log(results)
  if (eventCount > 0) {
    if (command.args.limitNow) { // if true, user just wants what's happening this moment
      
      // get the current time for calculating what event is happening right now (if any)
      const nowTimeStr = new Date(Date.now()).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
      const events = {
        titles: [],
        startTimes: [],
        endTimes: []
      }
      results.forEach((item) => {
        events.titles.push(item.name)
        events.startTimes.push(item.startTime)
        events.endTimes.push(item.endTime)
      })
      /* already know there's at least one event; There's 4 cases of things that could be happening:
       * 1. An event  is happening now (startTime[n] < 'now' < endTime[n]) (includes concurrent events)
       * 2. All events already happened ('now' is > endTime[eventCount-1] (last event))
       * 3. All events are in the future ('now' < startTime[0])
       * 4. In between two events ('now' is actually a break between 2 events)
       */
      for (let i = 0; i < eventCount; i++) {
        const diffStart = timeStrDiffMin(nowTimeStr, events.startTimes[i]) // negative if startTime in past
        const diffEnd = timeStrDiffMin(nowTimeStr, events.endTimes[i]) // positive if endTime in future
        // case 3: everything in the future (only possible if i == 0 and events are sorted chronologically)
        if (0 < diffStart && 0 < diffEnd && i == 0) {
          overallReplyText = 'Nothing happening yet. First event (below) starting in ' + Math.floor(diffStart) + ' minutes. (' + eventCount + ' overall events)'
          schedule.push({
            'title': events.titles[i],
            'text': startEndTimeFmt(events.startTimes[i], events.endTimes[i]),
            'mrkdwn_in': [ 'text' ]
          })
          break // exit loop early
        // case 2: All events already happened (on the last iteration and diffEnd is negative)
        } else if (i == eventCount-1 && 0 >= diffEnd) {
          overallReplyText = 'All events have passed. Last event in ' + command.querySpace + ' was: (' + eventCount + ' overall events)'
          schedule.push({
            'title': events.titles[i],
            'text': startEndTimeFmt(events.startTimes[i], events.endTimes[i]),
            'mrkdwn_in': [ 'text' ]
          })
        // case 4: It's a break between events
        // True if: both current start and end times are in the past AND start time of the next event is in the future
        } else if (0 > diffStart && 0 > diffEnd && i < eventCount-1) { // ensure there's still another event to check the start time of
          const nextEventDiffStart = timeStrDiffMin(nowTimeStr, events.startTimes[i+1])
          if (0 < nextEventDiffStart) {
            overallReplyText = 'Currently in a break between two events. Next event starts in ' + Math.floor(nextEventDiffStart) + ' minutes.'
            schedule.push({
              'title': '(Previous) ' + events.titles[i],
              'text': startEndTimeFmt(events.startTimes[i], events.endTimes[i]),
              'mrkdwn_in': [ 'text' ]
            })
            schedule.push({
              'title': '(Next) ' + events.titles[i+1],
              'text': startEndTimeFmt(events.startTimes[i+1], events.endTimes[i+1]),
              'mrkdwn_in': [ 'text' ]
            })
            break // exit loop early
          }
        // case 1: an event (or events) is(are) happening now
        } else if (diffStart <= 0 && 0 < diffEnd) {
          overallReplyText = 'Happening now in ' + command.querySpace + ' (' + eventCount + ' overall events):'
          schedule.push({
            'title': events.titles[i],
            'text': startEndTimeFmt(events.startTimes[i], events.endTimes[i]),
            'mrkdwn_in': [ 'text' ]
          })
        }
      }
    } else { // show all events
      overallReplyText = 'Events for ' + command.querySpace + ' on ' + command.queryDateStr + ' (' + eventCount + ' events):'
      results.forEach(function (item) {
        // console.log(item)
        schedule.push({
          'title': item.name,
          'text': startEndTimeFmt(item.startTime, item.endTime),
          'mrkdwn_in': [ 'text' ]
        })
      })
    }
  } else { //no events
    overallReplyText = 'There are ' + eventCount + ' events in ' + command.querySpace + ' on ' + command.queryDateStr + '.'
    schedule.push({
      'title': 'Wide open!'
    })
  }
  // console.log(schedule)
  return { //data
    'response_type': 'in_channel',
    'text': overallReplyText,
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
    var nowTimeStr = new Date(Date.now()).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    // console.log('nowtime: ' + nowTimeStr)

    if (eventCount === 1) {
      breaks.push({
        'title': `Only one booking today: ${eventTitles[0]}`,
        'text': `*Start Time:* ${startTimeStr[0]} | *End Time:* ${endTimeStr[0]}`,
        'mrkdwn_in': [ 'text' ]
      })
    } else {
    // go through event start and end times to calculate inter-event breaks.
    // this loop uses two variables to iterate through the lists for clarity.
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