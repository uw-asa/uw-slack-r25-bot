const expect = require('chai').expect
const getRoomId = require('../utils/getRoomId')

describe('getRoomId(roomQuery)', function () {
  it('should load the json list of rooms and return the id or null', function () {
    var queryAND = "AND 008"

    var ANDid = getRoomId(queryAND)

    expect(ANDid).to.equal('4587')

  })

  it('should find the id for WFS 201', function () {
    var queryWFS = "WFS 201"

    var WFSid = getRoomId(queryWFS)

    expect(WFSid).to.equal('5293')

  })

  it('should return null for a room not in the json list.', function () {
    var queryNotList = "KNE 035"

    var notInListId = getRoomId(queryNotList)

    expect(notInListId).to.be.null
    
  })

  it('should return null for non-string data type.', function() {
    var nonStringQuery = 305

    var notAString = getRoomId(nonStringQuery)

    expect(notAString).to.be.null
  })
})