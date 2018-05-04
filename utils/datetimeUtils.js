'use strict'

/* datetimeUtils.js
 * Chase Sawyer
 * University of Washington, 2018
 * 
 * Utility functions for dealing with dates/times in string and non-string formats.
 */

// Globals
const MS_IN_DAY = 86400000
const MS_IN_MINUTE = 60000
const LOCALE = 'en-US'

/**
 * Returns the time component of a datetime string without any timezone info.
 * @param {String} dateTimeStr in the form of '2018-04-18T09:30:00-07:00' or similar
 * @returns {String} Locale-relevant time string without timezone offset info.
 */
function getTimeFromDateTime(dateTimeStr) {
  dateTimeStr = dateTimeStr.slice(0, -6) // strip timezone
  var date = new Date(dateTimeStr)
  return date.toLocaleTimeString()
}

/**
 * Take a day delta string, and add that number of days to the current date.
 * @param {String} deltaStr must be in the form of '+#' where # is an integer.
 * @returns {String} Locale Date String (set to 'en-US')
 */
function getDateStrFromDayDelta(deltaStr) {
  if (deltaStr[0] == '+' && deltaStr.length > 1 && !isNaN(parseInt(deltaStr.slice(1)))) {
    var timeDiffMs = parseInt(deltaStr.slice(1)) * MS_IN_DAY
    var todayEpoch = new Date().getTime()
    return new Date(todayEpoch + timeDiffMs).toLocaleDateString(LOCALE)
  } else {
    return new Date().toLocaleDateString(LOCALE)
  }
}

/**
 * Take two time strings and give the duration between them in minutes.
 * Expects time strings to be in the form: 'HH:MM:SS'
 * Calculation is endtime minus begintime
 * @param {String} beginTime 
 * @param {String} endTime
 * @return {Number} Duration in minutes between endTime and beginTime
 *  - positive if end is after begin
 */
function timeStrDiffMin(beginTime, endTime) {
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
  getDateStrFromDayDelta,
  timeStrDiffMin
}