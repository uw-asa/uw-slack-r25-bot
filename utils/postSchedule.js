

const axios = require('axios')

function postSchedule(scheduleData, responseUrl) {
  axios.post(
    responseUrl,
    scheduleData,
    { //configuration
      headers: {
        'content-type': 'application/json'
      }
    }
  )
}

module.exports = postSchedule