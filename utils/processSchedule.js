

function processSchedule(results, queryText) {
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
    'text': queryText + ' has ' + eventCount + ' events today.',
    'attachments': schedule
  }
}

module.exports = processSchedule