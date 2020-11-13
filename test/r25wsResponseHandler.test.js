
const expect = require('chai').expect
const simpleMock = require('simple-mock')

const {
  processSchedule,
  processBreaks,
  processEmpty,
} = require('../utils/r25wsResponseHandler')
const {
  LOCALE,
  LOCALE_OPTIONS,
} = require('../utils/datetimeUtils')

describe('r25wsResponseHandler.processSchedule(results, command)', function () {

  it('expect \'Wide open!\' on empty results', function () {
    var schedule = processSchedule(testData.emptyValues.results, testData.emptyValues.command)
    expect(schedule.attachments[0].title).to.equal('Wide open!')
  })

  it('Expect \'Wide open!\' statement on empty results when requesting \'now\'', function () {
    const schedule = processSchedule(testData.emptyValues.results, {
      querySpace: '', queryDateStr: null, args: { limitNow: true }
    })
    expect(schedule.attachments[0].title).to.equal('Wide open!')
  })

  it('expect the return structure to have keys \'response_type\', \'text\', and \'attachments\'.', 
    function() {
      var schedule = processSchedule(testData.validExample.results, testData.validExample.command)
      expect(schedule).to.have.all.keys(['response_type', 'text', 'attachments'])
    })

  it('expect output text to reflect input values (valid)', function () {
    var schedule = processSchedule(testData.validExample.results, testData.validExample.command)
    expect(schedule.text).to.equal(
      'Events for ' + testData.validExample.command.querySpace + ' on ' + testData.validExample.command.queryDateStr +
      ' (' +testData.validExample.results.length + ' events):')
  })

  it('expect output text to reflect input values (empty/no events)', function () {
    var schedule = processSchedule(testData.emptyValues.results, testData.emptyValues.command)
    expect(schedule.text).to.equal(
      'There are ' + testData.emptyValues.results.length +
      ' events in ' + testData.emptyValues.command.querySpace +
      ' on ' + testData.emptyValues.command.queryDateStr + '.')
  })

  it('expect response type to always be \'in_channel\'', function () {
    var schedule = processSchedule(testData.validExample.results, testData.validExample.command)
    expect(schedule.response_type).to.equal('in_channel')

    schedule = processSchedule(testData.emptyValues.results, testData.emptyValues.command)
    expect(schedule.response_type).to.equal('in_channel')
  })

  /** Tests covering 'now' command suffix processing in the schedule handler
   * Case 1: One event happening now.
   */
  it('Expect now event to be declared when run against list of events (artificial now time set)', function () {
    const tmpTime = new Date().setHours(14, 0) // target third event in synthetic results
    simpleMock.mock(global.Date, 'now').returnWith(tmpTime)
    const command = {
      querySpace: 'TEST',
      queryDateStr: '01/01/0001',
      args: {
        limitNow: true
      }
    }
    const schedule = processSchedule(testData.validExample.results, command)
    simpleMock.restore() // undo changed time settings
    expect(schedule.text).to.equal(
      'Happening now in ' + command.querySpace + ' (' + testData.validExample.results.length + ' overall events):'
    )
    expect(schedule.attachments.length).to.equal(1)
    const {
      title,
      text
    } = schedule.attachments[0]
    const {
      name: resultName,
      startTime: resultStart,
      endTime: resultEnd
    } = testData.validExample.results[2]
    expect(title).to.equal(resultName)
    expect(text).to.equal('*Start Time:* ' + resultStart + ' | *End Time:* ' + resultEnd)
  })

  it('Returns valid response', function() {
    const tmpTime = new Date().setHours(14, 30)
    simpleMock.mock(global.Date, 'now').returnWith(tmpTime)
    const schedule = processSchedule(testData.validExampleTwo.results, testData.validExampleTwo.command)
    expect(schedule.text).to.not.be.empty
    simpleMock.restore()
  })

  it('Returns all events if multiple things happening at once ("now" command)', function () {
    const sampleSet = testData.validCrossListExample.results
    const tmpTime = new Date().setHours(10, 0) // target crosslist event in synthetic results
    simpleMock.mock(global.Date, 'now').returnWith(tmpTime)
    const command = {
      querySpace: 'TEST',
      queryDate: '01/01/0001',
      args: {
        limitNow: true
      }
    }
    const schedule = processSchedule(sampleSet, command)
    simpleMock.restore() // undo mocked time settings
    expect(schedule.text).to.equal(
      'Happening now in ' + command.querySpace + ' (' + sampleSet.length + ' overall events):'
    )
    expect(schedule.attachments.length).to.equal(2)
    // check that both appropriate results are returned in the correct order
    const resultsTitles = Array.from(schedule.attachments, (item) => item.title)
    const checkTitles = Array.from(sampleSet, (item) => item.name)
    expect(resultsTitles).to.have.ordered.members(checkTitles.slice(0, 2))
  })

  /** Case 2: All events already happened */
  it('Should reply with last event when all events have passed ("now" command)', function () {
    const sampleSet = testData.validExample.results
    // set target time after all events in synthetic results
    const tmpTime = new Date().setHours(16, 0)
    simpleMock.mock(global.Date, 'now').returnWith(tmpTime)
    const command = {
      querySpace: 'TEST',
      queryDate: '01/01/2001',
      args: {
        limitNow: true
      }
    }
    const schedule = processSchedule(sampleSet, command)
    simpleMock.restore() // undo mocked time setting
    expect(schedule.text).to.equal(
      'All events have passed. Last event in ' + command.querySpace + ' was: (' + sampleSet.length + ' overall events)'
    )
    expect(schedule.attachments.length).to.equal(1)
    expect(schedule.attachments[0].title).to.equal(sampleSet[sampleSet.length-1].name)
  })

  /** Case 3: All events in the future */
  it('Should reply with first event when none have happened yet ("now" command)', function () {
    const sampleSet = testData.validExample.results
    // set target time before all events in synthetic results
    const tmpTime = new Date().setHours(5, 0)
    simpleMock.mock(global.Date, 'now').returnWith(tmpTime)
    const command = {
      querySpace: 'TEST',
      queryDate: '01/01/2001',
      args: {
        limitNow: true
      }
    }
    const schedule = processSchedule(sampleSet, command)
    simpleMock.restore() // undo mocked time setting
    expect(schedule.text).to.match(
      /^Nothing happening yet\. First event \(below\) starting in \d+ minutes\. \(\d+ overall events\)/
    )
    expect(schedule.attachments.length).to.equal(1)
    expect(schedule.attachments[0].title).to.equal(sampleSet[0].name)
  })

  /** Case 4: Break in between events in the schedule */
  it('Should return both preceding and succeeding events if "now" called during break', function () {
    const sampleSet = testData.validExample.results
    // set target time to a gap between events in synthetic results (result indexes 1,2)
    const tmpTime = new Date().setHours(13, 25)
    simpleMock.mock(global.Date, 'now').returnWith(tmpTime)
    const command = {
      querySpace: 'Test',
      queryDate: '02/25/2001',
      args: {
        limitNow: true
      }
    }
    const schedule = processSchedule(sampleSet, command)
    simpleMock.restore() // undo mocked time setting
    expect(schedule.text).to.match(
      /^Currently in a break between two events\. Next event starts in \d+ minutes\./
    )
    expect(schedule.attachments.length).to.equal(2)
    // check that both appropriate results are returned in the correct order
    const resultsTitles = Array.from(schedule.attachments, (item) => item.title)
    let checkTitles = Array.from(sampleSet, (item) => item.name)
    // modify local titles to have "(Previous)" and "(Next)" prefixes
    checkTitles = checkTitles.slice(1 ,3)
    checkTitles[0] = `(Previous) ${checkTitles[0]}`
    checkTitles[1] = `(Next) ${checkTitles[1]}`
    expect(resultsTitles).to.have.ordered.members(checkTitles)
    // check that the times are appropriate and in the correct order
    const resultsTimes = Array.from(schedule.attachments, (item) => item.text)
    const checkTimes = Array.from(sampleSet, (item) => `*Start Time:* ${item.startTime} | *End Time:* ${item.endTime}`)
    expect(resultsTimes).to.have.ordered.members(checkTimes.slice(1,3))
  })
})

describe('r25wsResponseHandler.processBreaks(results, command)', function () {
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

  it('Expect \'Only one booking...\' with booking detail for all breaks request but only one event scheduled.', function() {
    // Destructure local test data for easier variable comparison
    const {
      validSingleExample: {
        results
      }
    } = testData
    var breaks = processBreaks(results, {
      querySpace: 'ARC 147',
      args: {
        allBreaks: true
      }
    })
    expect(breaks.response_type).to.equal('in_channel')
    expect(breaks.text).to.equal('Breaks for ARC 147')
    expect(breaks.attachments[0].title).to.equal(`Only one booking today: ${results[0].name}`)
    expect(breaks.attachments[0].text).to.equal(`*Start Time:* ${results[0].startTime} | *End Time:* ${results[0].endTime}`)
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

  it('Expect "next break" to return the next break in a list of events if run in between those events', function () {
    // this is a tricky test, as the test data must be generated relative to the current time the test is run for accuracy.
    const tmpTime = new Date().setHours(12)
    simpleMock.mock(global.Date, 'now').returnWith(tmpTime)
    let currentEpoch = new Date(Date.now()).getTime()
    let s1_seventyMinAgo = new Date(currentEpoch - 4200000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let e1_twentyMinAgo = new Date(currentEpoch - 1200000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let s2_tenMinAgo = new Date(currentEpoch - 600000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let e2_fortyMinFuture = new Date(currentEpoch + 2400000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let s3_fiftyMinFuture = new Date(currentEpoch + 3000000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let e3_hundredMinFuture = new Date(currentEpoch + 6000000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
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
    // with relative results generated, we can formulate the next break command, and check result
    var breaks = processBreaks(results, {
      querySpace: 'irrelevant, really',
      args: {
        allBreaks: false
      }
    })
    expect(breaks.attachments.length).to.equal(1)
    expect(breaks.attachments[0].title).to.equal('Break between Current Event and Next Event')
    expect(breaks.attachments[0].text).to.equal(e2_fortyMinFuture + ' to ' + s3_fiftyMinFuture + ' *(10 mins)*')
    simpleMock.restore()
  })

  it('Expect "next break" to return no further events when run near midnight (technically a bug)', function () {
    // This test is actually validating a bug - but validates the current state of affairs. Eventually it will need to be replaced when the
    // underlying code that calculates breaks and events takes into account events spanning midnight.
    const tmpTime = new Date().setHours(23, 15) // set time 45 min before midnight
    simpleMock.mock(global.Date, 'now').returnWith(tmpTime)
    let currentEpoch = new Date(Date.now()).getTime()
    let s1_seventyMinAgo = new Date(currentEpoch - 4200000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let e1_twentyMinAgo = new Date(currentEpoch - 1200000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let s2_tenMinAgo = new Date(currentEpoch - 600000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let e2_fortyMinFuture = new Date(currentEpoch + 2400000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let s3_fiftyMinFuture = new Date(currentEpoch + 3000000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let e3_hundredMinFuture = new Date(currentEpoch + 6000000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
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
    // with relative results generated, we can formulate the next break command, and check result
    const spaceName = 'TEST SPACE'
    var breaks = processBreaks(results, {
      querySpace: spaceName,
      args: {
        allBreaks: false
      }
    })
    // TODO: fix this behavior around events close to/spanning midnight.
    expect(breaks).not.to.have.property('attachments')
    expect(breaks.text).to.equal('No further short breaks. Last booking in ' + spaceName + ' ends/ended at ' + e3_hundredMinFuture)
    simpleMock.restore()
  })

  it('Expect to receive message about the last break ending if there are events, but all breaks have passed.', function () {
    // like above, all times must be manufactured to be relative to test run time.
    let currentEpoch = new Date().getTime()
    let s1_seventyMinAgo = new Date(currentEpoch - 4200000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let e1_twentyMinAgo = new Date(currentEpoch - 1200000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let s2_tenMinAgo = new Date(currentEpoch - 600000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
    let e2_fortyMinFuture = new Date(currentEpoch + 2400000).toLocaleTimeString(LOCALE, LOCALE_OPTIONS)
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
      }
      //no next event
    ]
    // with relative results generated, we can formulate the next break command, and check result
    var breaks = processBreaks(results, {
      querySpace: 'SPACE',
      args: {
        allBreaks: false
      }
    })
    expect(breaks.attachments).to.be.undefined
    expect(breaks.text).to.equal('No further short breaks. Last booking in SPACE ends/ended at ' + e2_fortyMinFuture)
  })
})

describe('processEmpty(command)', function () {
  it('should create an in_channel response with error text', function () {
    const command = {
      resolvedCommandText: 'error text'
    }
    const data = processEmpty(command)
    expect(data.response_type).to.equal('in_channel')
    expect(data.text).to.equal(command.resolvedCommandText)
  })
})


const testData = {
  emptyValues: {
    results: [],
    command: {
      querySpace: '',
      queryDateStr: null,
      args: {
        limitNow: false
      }
    }
  },
  validSingleExample: {
    results: [
      {
        name: 'MATH 124 A',
        startTime: '09:30:00',
        endTime: '10:20:00' 
      },
    ],
    command: {
      querySpace: 'ARC 147',
      queryDateStr: '02/14/2019',
      args: {
        limitNow: false
      }
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
      queryDateStr: '04/17/2018',
      args: {
        limitNow: false
      }
    }
  },
  validExampleTwo: {
    results: [
      {
        name: 'Music #8',
        startTime: '09:30:00',
        endTime: '10:30:00'
      },
      {
        name: 'Music #6',
        startTime: '11:30:00',
        endTime: '12:30:00'
      },
      {
        name: 'Music #4',
        startTime: '14:00:00',
        endTime: '15:00:00'
      },
      {
        name: 'Music #9',
        startTime: '15:30:00',
        endTime: '17:20:00'
      }
    ],
    command: {
      roomId: '5116',
      querySpace: 'mus 223',
      queryDate: '11/12/2020',
      args: { limitNow: true }
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