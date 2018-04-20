
const axios = require('axios')
const parseString = require('xml2js-parser').parseString
var stripNS = require('xml2js-parser').processors.stripPrefix;

exports.getTimesForId = function (roomId, callback) {
  var resourceUrl = process.env.R25WSROOTURL + "rm_rsrvs.xml"
  var response = axios.get(resourceUrl, {
    params: {
      space_id: roomId
    },
    auth: {
      username: process.env.R25WSUSER,
      password: process.env.R25WSPASS
    },
    responseType: 'document',
    timeout: 10000
  })
  .then(function(response) {
    //parse response xml
    parseString(response.data, { tagNameProcessors: [stripNS], mergeAttrs: true }, function (err, result) {
      // console.log(result)
      var reservationsRoot = result.space_reservations.space_reservation
      var schedule = []
      reservationsRoot.forEach(function (el) {
        // console.log(el.reservation_start_dt[0])
        var course = {
          name: el.event_name[0],
          startTime: getTimeFromDateTime(el.reservation_start_dt[0]),
          endTime: getTimeFromDateTime(el.reservation_end_dt[0])
        }
        schedule.push(course)
      })
      // console.log(schedule)
      callback(schedule)
    })
  })
  .catch(function (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data)
      console.log(error.response.status)
      console.log(error.response.headers)
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request)
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message)
    }
    console.log(error.config)
    callback(error)
  })
}

function getTimeFromDateTime(dateTimeStr) {
  dateTimeStr = dateTimeStr.slice(0, -6)
  var date = new Date(dateTimeStr)
  return date.toLocaleTimeString()
} 