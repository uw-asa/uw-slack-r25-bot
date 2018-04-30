
const timeStrDiffMin = require('./datetimeUtils').timeStrDiffMin

function processSchedule(results, command) {
  var schedule = []
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
  } else {
    schedule.push({
      'title': 'Wide open!'
    })
  }
  // console.log(schedule)
  return { //data
    'response_type': 'in_channel',
    'text': command.querySpace + ' has ' + eventCount + ' events today.',
    'attachments': schedule
  }
}

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
  } else {
    // no events = no breaks
    nextBreakIndex = 0 // set in case command asked for next break but there are no breaks or events
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
  } else { // not all breaks // allBreaks == false
    responseData['text'] = 'Next Break for ' + command.querySpace
    let singleBreak = [breaks[nextBreakIndex]] // make an array copy, only keeping the desired break item.
    responseData['attachments'] = singleBreak
  }

  return responseData
}

module.exports = {
  processSchedule,
  processBreaks
}