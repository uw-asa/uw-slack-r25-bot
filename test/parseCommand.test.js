
const expect = require('chai').expect

const parser = require('../utils/parseCommand').parseCommand

describe('parseCommand(queryText)', function () {
  it('Number of command elements counted correctly.', function () {
    const testStrings = [
      'this is a 6 element string',
      'this  string  has  double  spaces',
      'this string   has a   mixture of  spaces',
      'only two',
      'one',
    ]
    const expectedCounts = [6, 5, 7, 2, 1]
    for (var i = 0; i < testStrings.length; i++) {
      var result = parser(testStrings[i])
      expect(result.numberOfElements).to.equal(expectedCounts[i])
    }
  })

  it('Expect querySpace to always contain the first two elements if present', function () {
    const testStrings = [
      'this is a 6 element string',
      'one Two',
      'OnE Two ThrEE',
      'only two',
      'one 5161516',
    ]
    const expectedQuerySpaceStrings = [
      'THIS IS',
      'ONE TWO',
      'ONE TWO',
      'ONLY TWO',
      'ONE 5161516'
    ]
    for (var i = 0; i < testStrings.length; i++) {
      var result = parser(testStrings[i])
      expect(result.querySpace).to.equal(expectedQuerySpaceStrings[i])
    }
  })

  it('Expect a roomId if command length >= 2 and first 2 params are valid', function () {
    var result = parser('arc 147')
    expect(result.numberOfElements).to.equal(2)
    expect(result.roomId).to.not.be.null
    expect(result.roomId).to.equal('6063')
    result = parser('arc 222')
    expect(result.roomId).to.be.null
  })

  it('Expect help text if given the \'help\' command', function () {
    var result = parser('help')
    expect(result.resolvedCommandText).to.be.a('string')
    expect(result.resolvedCommand).to.equal('HELP')
  })

  it('Expect \'ERROR\' non-help, short command', function () {
    var result = parser('nothelp')
    expect(result.resolvedCommand).to.equal('ERROR')
    expect(result.resolvedCommandText).to.not.be.null
  })

  it('Expect \'ERROR\' resolved command for 2 incorrect params', function () {
    var result = parser('one two')
    expect(result.resolvedCommand).to.equal('ERROR')
    expect(result.resolvedCommandText).to.not.be.null
  })

  it('Expect \'SCHEDULE\', roomID, and dayDeltaStr pf \'+1\' for valid \'...tomorrow\' query', function () {
    var result = parser('KNE 130 tomorrow')
    expect(result.numberOfElements).to.equal(3)
    expect(result.resolvedCommand).to.equal('SCHEDULE')
    expect(result.roomId).to.equal('4992')
    expect(result.args.dayDeltaStr).to.equal('+1')
  })

  it('Expect \'BREAKS\' resolved command for valid query room for \'breaks\'', function () {
    var result = parser('KNE 210 breaks')
    expect(result.numberOfElements).to.equal(3)
    expect(result.roomId).to.equal('4993')
    expect(result.resolvedCommand).to.equal('BREAKS')
    expect(result.args.allBreaks).to.equal(true)
  })

  it('Expect \'SCHEDULE\' and correct parsing of \'+[dayoffset]\' with numerical offset', function () {
    var result = parser('ARC 147 +2')
    expect(result.numberOfElements).to.equal(3)
    expect(result.resolvedCommand).to.equal('SCHEDULE')
    expect(result.roomId).to.equal('6063')
    expect(result.args.dayDeltaStr).to.equal('+2')
  })

  it('Expect no day delta and ERROR for \'+{non-numeral}\' on otherwise correct query', function () {
    var result = parser('ARC 147 +three')
    expect(result.numberOfElements).to.equal(3)
    expect(result.args.dayDeltaStr).to.be.null
    expect(result.resolvedCommand).to.equal('ERROR')
    expect(result.resolvedCommandText).to.not.be.null
  })

  it('Expect \'...next break\' to parse correctly', function () {
    var result = parser('KNE 130 next break')
    expect(result.numberOfElements).to.equal(4)
    expect(result.resolvedCommand).to.equal('BREAKS')
    expect(result.args.allBreaks).to.equal(false)
  })

  it('Parses "...now" command correctly', function () {
    const result = parser('KNE 130 now')
    expect(result.numberOfElements).to.equal(3)
    expect(result.resolvedCommand).to.equal('SCHEDULE')
    expect(result.args.limitNow).to.be.true
  })

})