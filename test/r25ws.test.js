// note - set env vars manually in mocha set up

const expect = require('chai').expect

const r25ws = require('../utils/r25ws')
const r25wsVars = require('../env-vars/r25ws.json')

describe('r25ws.getTimesForId(id)', function () {
  before(function () {
    process.env.R25WSROOTURL = r25wsVars.baseUrl
    process.env.R25WSUSER = r25wsVars.user
    process.env.R25WSPASS = r25wsVars.password
  })

  it('should return and process xml for ARC 147 given id "6063"', function (done) {
    this.timeout(10000) // access r25 data store, takes time
    // requires a command object with dayDeltaStr and roomId
    var command = {
      dayDeltaStr: '+0',
      roomId: '6063'  // == ARC 147
    }
    r25ws.getTimesForId(command, function(result) {
      done()
      // console.log(result)
      expect(result).to.be.instanceOf(Array)
    })
  })
})