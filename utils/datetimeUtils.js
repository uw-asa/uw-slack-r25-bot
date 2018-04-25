

function getTimeFromDateTime(dateTimeStr) {
  /* Returns the time component of a datetime string without any timezone info.
  dateTimeStr: string in the form of '2018-04-18T09:30:00-07:00' or similar
  */
  dateTimeStr = dateTimeStr.slice(0, -6)
  var date = new Date(dateTimeStr)
  return date.toLocaleTimeString()
}

module.exports = { 
  getTimeFromDateTime
}