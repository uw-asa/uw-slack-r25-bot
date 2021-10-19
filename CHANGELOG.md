# Changes

## [2021-10-19] Unreleased

- Updated AWS-SDK: 2.907.0 -> 2.1011.0
- Updated serverless (dev): 2.41.2 -> 2.63.0
- Updated mocha(dev): 8.4.0 -> 9.1.3

## [2021-10-15] Version 2.4.3

- Added HRC rooms [#25](https://github.com/uw-asa/uw-slack-r25-bot/issues/25)

## [2021-10-15] 2.4.2

- Update Node runtime support [#30](https://github.com/uw-asa/uw-slack-r25-bot/issues/30)
  - Added support for Node 14.x
  - Dropped support for Node 10.x
- Patched issue with LOCALE_OPTIONS that was causing time strings being compared to be a little weird. Overall still haven't fixed the issue surrounding events spanning Midnight. See [#14](https://github.com/uw-asa/uw-slack-r25-bot/issues/14)
- Updated `serverless.yml` to clear up some deprecation warnings, config issues due to changes with how the framework handles some things.
  - Added note to `README.md` regarding tests to serverless syntax before deployment.

## [2021-05-14] Version 2.4.1

### Space Edits

- Re-added PAR Rooms with their codes

### Dependencies

- Updated
  - serverless
  - chai
  - mocha
  - axios
  - aws-sdk

## Version 2.4.0

### Feature added: "now" command suffix

Users can now ask for exactly what is happening at the time of command invocation by suffixing the room number with "now". This returns one of several kinds of message: If there is one event (or multiple cross listed events) then they will be returned to the user, along with the overall day's totals. If all events are in the future/past in relation to "now", then the returned info will say how long until the next event is, or how long since the last event ended (and what those events are). Finally, if "now" is a break in between events, then the command will return both the preceding and succeeding events are and how long it will be until the next event.

## Version 2.3.7

### Dependencies

- Updated mocha 2 major versions (from 6 to 8)

## Version 2.3.6

- Fixed vscode run configuration to debug tests
- Discovered issue handling events spanning midnight via tests that fail because functions don't take into account the date.
  - Issue #14 raised
  - Fixed broken tests to be consistent regardless of the actual time that the tests are run by manipulating the global time.
    - Fix changed `r25wsResponseHandler.js` and related `r25wsResponseHandler.test.js`
  - confirmed that local and CI tests now pass

## Version 2.3.5 (squashed into 2.3.6)

- Updated serverless dependency
  - Changed `serverless.yml` to remove events.http.integration

## Version 2.3.4

- Updated aws-sdk dependency

## Version 2.3.3

- Updated axios dependency

## Version 2.3.2

- ⚙ Added CI via Github Actions
  - Tests against Node.js v10 and v12
  - Runs for PRs against master branch, and master branch commits

### Dependency updates

- aws-sdk
- mocha
- serverless
- axios

### Runtime Change ⚠

- No more support for Node 8.10 on AWS Lambda. Set runtime to nodejs 12.

## Version 2.3.1

- Added locale control to ensure that date/time parsing presents the correct data (specify use of 24 hour time format)
- Added condition to r25wsResponseHandler.processBreaks() that returns a different message if there's only one booking on the specified day. (6eb1c58)

- Updated dependencies
  - aws-sdk
  - axios
  - mocha
  - serverless
- Updated readme
  - Instructions on how to update space IDs so that the parse function is aware of the changes.

### Spaces edits

- Updated room names for CSE2

## Version 2.3.0

- Updated getRoomId.test.js
- Added note to `serverless.yml` regarding needing to set the stage before deployment
- Fixed `node_modules` gitignore setting

### Spaces edits

- Added eeb/ece 003 to spaces list
- Fixed space ID for EEB/ECE 045

## Version 2.2.0

- Updated spaces IDs
- Added coverage dirs. to gitignore
- Updated dependencies
  - aws-sdk
  - serverless
  - mocha
  - chai

## Version 2.1

- Added documentation for all functions and files
- all files 'use strict'
- Authoring information added
- Test added to ensure that 'NEXT BREAK' command works successfully under all cases

## Version 2.0

Major revision with added functionality to look at schedules for days in the future and breaks or the next break for a space. Also added a help command to retrieve help text about the functionality of the commands. Also split functionality between two separate Lambda functions, one to process the command, and the other to contact the R25 web service and return the result to Slack once the results have been gathered.

- Added commands:
  - /r25 [building code] [room number] breaks
  - /r25 [building code] [room number] next break
  - /r25 [building code] [room number] tomorrow
  - /r25 [building code] [room number] [+1 | +2 | +3 ... etc]
  - /r25 help
- Added more testing to confirm commands and helper functions return correct info.
- Split the parsing of the command received off from the execution of the web service request and processing.
  - Uses AWS SNS to pass information/trigger from the first Lambda function (parse) to the second (web service request).

## Versions 1.0+

Minimum viable product versions and incremental improvements.

### Version 1.1

- Adeded case-insensitivity for parsing command.
- Automated tests

### Version 1.0

- Basic functionality, only able to query today's events for a given space.