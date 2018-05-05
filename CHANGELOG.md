# Changes

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