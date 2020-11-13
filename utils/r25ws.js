'use strict'

/* r25ws.js
 * Chase Sawyer
 * University of Washington, 2018-2019
 * 
 * Helper function(s) for communicating with the Resource25 web service. R25 web service documentation 
 * can be found at http://knowledge25.collegenet.com/display/WSW/Home
 * R25 web service returns XML data that can be then post-processed.
 * 
 * An XML based description of the API can be found by requesting the r25.xml document:
 * https://webservices.collegenet.com/r25ws/wrd/sample/run/r25.xml
 */

// libs
const axios = require('axios') // for contacting the web service
const parseString = require('xml2js-parser').parseString 
var stripNS = require('xml2js-parser').processors.stripPrefix

// local utils
const datetimeUtils = require('./datetimeUtils')

/**
 * Uses the rm_rsrvs.xml endpoint.
 * Given the room ID and any offset number of days, will get the schedule in the matching room
 * for the current date or current date + offset.
 * @param {JSON object} command Parsed command object containing at minimum: 'roomId'
 * @param {function} callback Command to call once request returns from R25 web service with data
 */
function getTimesForId(command, callback) {
  const resourceUrl = process.env.R25WSROOTURL + 'rm_rsrvs.xml'
  var queryData = {
    params: {
      space_id: command.roomId
    },
    auth: {
      username: process.env.R25WSUSER,
      password: process.env.R25WSPASS
    },
    responseType: 'document',
    timeout: 20000 // ms. r25ws can be very slow at times and for complex queries.
  }

  if (command.args.dayDeltaStr != null) {
    queryData.params.start_dt = command.args.dayDeltaStr
    queryData.params.end_dt = command.args.dayDeltaStr
  }
  // console.log('gettimesforid url: ' + resourceUrl)
  // console.log('gettimesforid data: ' + queryData)

  axios.get(resourceUrl, queryData)
    .then(function(response) {
      // console.log(response)
      console.log('response status: ' + response.status)
      console.log('res status text: ' + response.statusText)
      // console.log(response.data)
      // parse response xml, trimming namespace tags out
      parseString(response.data, { tagNameProcessors: [stripNS], mergeAttrs: true }, function (err, result) {
        if (err) {
          console.log(err)
        } else {
          var schedule = [] // Array of event objects to be sent back to callback function
          // if the returned data can't be parsed, or is an empty response...)
          if (result.space_reservations === undefined) {
            callback(null)
          } else {
            if (Object.prototype.hasOwnProperty.call(result.space_reservations, 'space_reservation')) {
              const reservationsRoot = result.space_reservations.space_reservation
              try {
                reservationsRoot.forEach(function (el) {
                  var event = {
                    name: el.event_name[0],
                    startTime: datetimeUtils.getTimeFromDateTime(el.reservation_start_dt[0]),
                    endTime: datetimeUtils.getTimeFromDateTime(el.reservation_end_dt[0])
                  }
                  schedule.push(event)
                })
              } catch (err) {
                console.log(err)
              }
            }
            callback(schedule)
          }
        }
      })
    })
    .catch(function (error) {
      console.log('r25ws AXIOS GET ERROR')
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
      callback(null)
    })
  // end GET
}

module.exports = {
  getTimesForId
}