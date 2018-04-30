
const expect = require('chai').expect

const processSchedule = require('../utils/r25wsResponseHandler').processSchedule
const processBreaks = require('../utils/r25wsResponseHandler').processBreaks

describe('processSchedule(results, command)', function () {

  it('expect \'Wide open!\' on empty results', function () {
    var schedule = processSchedule(testData.emptyValues.results, testData.emptyValues.command)
    expect(schedule.attachments[0].title).to.equal('Wide open!')
  })

  it('expect the return structure to have keys \'response_type\', \'text\', and \'attachments\'.', 
    function() {
      var schedule = processSchedule(testData.validExample.results, testData.validExample.command)
      expect(schedule).to.have.all.keys(['response_type', 'text', 'attachments'])
    })

  it('expect output text to reflect input values', function () {
    var schedule = processSchedule(testData.validExample.results, testData.validExample.command)
    expect(schedule.text).to.equal(
      'Events for ' + testData.validExample.command.querySpace + ' on ' + testData.validExample.command.queryDateStr +
      ' (' +testData.validExample.results.length + ' events):')

    schedule = processSchedule(testData.emptyValues.results, testData.emptyValues.command)
    expect(schedule.text).to.equal(
      'Events for ' + testData.emptyValues.command.querySpace + ' on ' + testData.emptyValues.command.queryDateStr +
      ' (' +testData.emptyValues.results.length + ' events):')
  })

  it('expect response type to always be \'in_channel\'', function () {
    var schedule = processSchedule(testData.validExample.results, testData.validExample.command)
    expect(schedule.response_type).to.equal('in_channel')

    schedule = processSchedule(testData.emptyValues.results, testData.emptyValues.command)
    expect(schedule.response_type).to.equal('in_channel')
  })
})

describe('processBreaks(results, command)', function () {
  it('Expect \'Wide open!\' on empty results, with all breaks.', function () {
    var breaks = processBreaks(testData.emptyValues.results, {
      querySpace: '',
      args: {
        allBreaks: true
      }
    })
    expect(breaks.attachments[0].title).to.equal('Wide open!')
  })

  it('Expect \'Wide open!\' on empty results, with all breaks = false', function () {
    var breaks = processBreaks([], {
      querySpace: '',
      args: {
        allBreaks: false
      }
    })
    expect(breaks.attachments[0].title).to.equal('Wide open!')
  })

  it('Expect number of returned breaks to = #of events -1 for all non-cross-listed events', function () {
    var breaks = processBreaks(testData.validExample.results, {
      querySpace: 'ARC 147',
      args: {
        allBreaks: true
      }
    })
    expect(breaks.attachments.length).to.equal(testData.validExample.results.length - 1)
  })

  it('Expect number of returned breaks to = # of events -2 for list with 1 cross-listed event', function () {
    var breaks = processBreaks(testData.validCrossListExample.results, {
      querySpace: 'ARC 147',
      args: {
        allBreaks: true
      }
    })
    expect(breaks.attachments.length).to.equal(testData.validCrossListExample.results.length - 2)
  })

  it('Expect next break to return the next break in a list of events', function () {
    // this is a tricky test, as the test data must be generated relative to the current time the test is run for accuracy.
    let currentEpoch = new Date().getTime()
    let s1_seventyMinAgo = new Date(currentEpoch - 4200000).toLocaleTimeString()
    let e1_twentyMinAgo = new Date(currentEpoch - 1200000).toLocaleTimeString()
    let s2_tenMinAgo = new Date(currentEpoch - 600000).toLocaleTimeString()
    let e2_fortyMinFuture = new Date(currentEpoch + 2400000).toLocaleTimeString()
    let s3_fiftyMinFuture = new Date(currentEpoch + 3000000).toLocaleTimeString()
    let e3_hundredMinFuture = new Date(currentEpoch + 6000000).toLocaleTimeString()
    var results = [
      {
        name: 'Past Event',
        startTime: s1_seventyMinAgo,
        endTime: e1_twentyMinAgo
      },
      {
        name: 'Current Event',
        startTime: s2_tenMinAgo,
        endTime: e2_fortyMinFuture
      },
      {
        name: 'Next Event',
        startTime: s3_fiftyMinFuture,
        endTime: e3_hundredMinFuture
      }
    ]
    // with relative results generated, we can formulate the next break command, anc check result
    var breaks = processBreaks(results, {
      querySpace: 'irrelevant, really',
      args: {
        allBreaks: false
      }
    })
    expect(breaks.attachments.length).to.equal(1)
    expect(breaks.attachments[0].title).to.equal('Break between Current Event and Next Event')
    expect(breaks.attachments[0].text).to.equal(e2_fortyMinFuture + ' to ' + s3_fiftyMinFuture + ' *(10 mins)*')
  })
})


const testData = {
  emptyValues: {
    results: [],
    command: {
      querySpace: '',
      queryDateStr: null
    }
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
    command: {
      querySpace: 'ARC 147',
      queryDateStr: '04/17/2018'
    }
  },
  validCrossListExample: {
    results: [
      {
        name: 'MATH 124 A',
        startTime: '09:30:00',
        endTime: '10:20:00' 
      },
      {
        name: 'MATH 124 B',
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
    ]
  }
}