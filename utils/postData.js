

const axios = require('axios')

function postData(scheduleData, responseUrl) {
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

module.exports = {
  postData
}