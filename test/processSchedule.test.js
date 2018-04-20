
const expect = require('chai').expect

const processSchedule = require('../utils/processSchedule')

describe('processSchedule(results, queryText)', function () {

  it('expect \'Wide open!\' on empty results', function () {
    var schedule = processSchedule(testData.emptyValues.results, testData.emptyValues.queryText)
    expect(schedule.attachments[0].title).to.equal('Wide open!')
  })

  it('expect the return structure to have keys \'response_type\', \'text\', and \'attachments\'.', 
  function() {
    var schedule = processSchedule(testData.validExample.results, testData.validExample.queryText)
    expect(schedule).to.have.all.keys(['response_type', 'text', 'attachments'])
  })

  it('expect output text to reflect input values', function () {
    var schedule = processSchedule(testData.validExample.results, testData.validExample.queryText)
    expect(schedule.text).to.equal(testData.validExample.queryText + ' has ' + testData.validExample.results.length + ' events today.')

    schedule = processSchedule(testData.emptyValues.results, testData.emptyValues.queryText)
    expect(schedule.text).to.equal(testData.emptyValues.queryText + ' has ' + testData.emptyValues.results.length + ' events today.')
  })

  it('expect response type to always be \'in_channel\'', function () {
    var schedule = processSchedule(testData.validExample.results, testData.validExample.queryText)
    expect(schedule.response_type).to.equal('in_channel')

    schedule = processSchedule(testData.emptyValues.results, testData.emptyValues.queryText)
    expect(schedule.response_type).to.equal('in_channel')
  })

})




const testData = {
  emptyValues: {
    results: [],
    queryText: ''
  },
  validExample: {
    results: [
      {
        name: 'MATH 124 A',
        startTime: '09:30:00',
        endTime: '10:20:00' 
      },
      {
        name: 'ATM S 103 A',
        startTime: '12:30:00',
        endTime: '13:20:00' 
      },
      {
        name: 'JSIS 202 A',
        startTime: '13:30:00',
        endTime: '14:20:00' 
      },
      { 
        name: 'LING 200 A',
        startTime: '14:30:00',
        endTime: '15:20:00' 
      }
    ],
    queryText: 'ARC 147'
  }
}