
const MS_IN_DAY = 86400000
const MS_IN_MINUTE = 60000

function getTimeFromDateTime(dateTimeStr) {
  /* Returns the time component of a datetime string without any timezone info.
  dateTimeStr: string in the form of '2018-04-18T09:30:00-07:00' or similar
  */
  dateTimeStr = dateTimeStr.slice(0, -6)
  var date = new Date(dateTimeStr)
  return date.toLocaleTimeString()
}

/*
function getDayDeltaStrFromDate(dateStr) {
  /* Parse the difference between a specified date and today, returning the
  time difference in days.*
  var date = new Date(dateStr)
  if (date != 'Invalid Date') {
    
  }
  // TODO: how to handle error here?
}
*/
function getDateStrFromDayDelta(deltaStr) {
  /* Take a day delta str, and add that number of days to the current date.
    deltaStr must be in the form of '+#' where # is an integer. */
  if (deltaStr[0] == '+' && deltaStr.length > 1 && !isNaN(parseInt(deltaStr.slice(1)))) {
    var timeDiffMs = parseInt(deltaStr.slice(1)) * MS_IN_DAY
    var todayEpoch = new Date().getTime()
    return new Date(todayEpoch + timeDiffMs).toLocaleDateString('en-US')
  } else {
    return new Date().toLocaleDateString('en-US')
  }
}

function timeStrDiffMin(beginTime, endTime) {
  /* take two time strings and give the difference in minutes.
    Expects time strings to be in the form: 'HH:MM:SS' */
  beginTime = beginTime.split(':')
  endTime = endTime.split(':')
  // create dates with only the times filled in
  var beginEpoch = new Date(0, 0, 0, beginTime[0], beginTime[1], beginTime[2], 0).getTime()
  var endEpoch = new Date(0, 0, 0, endTime[0], endTime[1], endTime[2], 0).getTime()
  var timeDiff = endEpoch - beginEpoch
  timeDiff = timeDiff / MS_IN_MINUTE
  // console.log(timeDiff + ' mins')
  return timeDiff
}

module.exports = { 
  getTimeFromDateTime,
  // getDayDeltaStrFromDate,
  getDateStrFromDayDelta,
  timeStrDiffMin
}