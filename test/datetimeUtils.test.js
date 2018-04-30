
const expect = require('chai').expect
const datetimeUtils = require('../utils/datetimeUtils')

describe('datetimeUtils.js getTimeFromDateTime()', function () {
  it('Expect time portion of datetime string', function () {
    var result = datetimeUtils.getTimeFromDateTime('2018-04-18T09:30:00-07:00')
    expect(result).to.equal('09:30:00')
  })
})

describe('datetimeUtils.js getDateStrFromDayDelta()', function () {
  it('Expect locale date string to be offset by 1 for \'+1\'', function () {
    var result = datetimeUtils.getDateStrFromDayDelta('+1')
    var todayEpoch = new Date().getTime()
    var expectedResult = new Date(todayEpoch + 86400000).toLocaleDateString('en-US')
    expect(result).to.equal(expectedResult)
  })

  it('Expect no offset if offset parameter is malformed', function () {
    var result = datetimeUtils.getDateStrFromDayDelta('5')
    var expectedResult = new Date().toLocaleDateString('en-US')
    expect(result).to.equal(expectedResult)
  })
})

describe('datetimeUtils.js timeStrDiffMin()', function () {
  it('Expect an integer response for two correct time string params.', function () {
    var result = datetimeUtils.timeStrDiffMin('10:00:00', '10:30:00')
    expect(result).to.equal(30)
  })

  it('Expect a negative time difference for end time before start time.', function () {
    var result = datetimeUtils.timeStrDiffMin('10:30:00', '10:00:00')
    expect(result).to.equal(-30)
  })

  it('Expect correct parsing of 24-hr times', function () {
    var result = datetimeUtils.timeStrDiffMin('13:00:00', '14:00:00')
    expect(result).to.equal(60)
  })
})