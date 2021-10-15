# UW Slack / R25 Integration

This is a custom integration for the [University of Washington](https://www.washington.edu/) between [Slack](https://slack.com/) and R25, part of the [CollegeNET](https://corp.collegenet.com/products/scheduling/scheduling.html) Series25 scheduling solution's web service API.

## Use instructions

### Summary

From within any Slack channel where the integration has been enabled, the following slash commands can be executed:

- `/r25 help`
- `/r25 [building code] [room number]`
- `/r25 [building code] [room number] now`
- `/r25 [building code] [room number] tomorrow`
- `/r25 [building code] [room number] +1`
- `/r25 [building code] [room number] +2`
- `/r25 [building code] [room number] breaks`
- `/r25 [building code] [room number] next break`

#### Example Commands

- `/r25 kne 130 breaks`

### Schedules

From within any Slack channel type `/r25` followed by a building code, such as 'arc' or 'kne', followed by the room number. If the building code and room number match supported rooms, then the schedule for that room will be retrieved and posted into the Slack channel.

You may also get schedules for days in the future by following the room number with either the 'tomorrow' keyword, or a plus and a number, such as '+1'. Any number of days in the future may be requested, but large numbers don't resolve data.

### Breaks

Adding the 'breaks' keyword after the query space returns the break periods between scheduled classes and events, along with their durations. The key phrase 'next break' may be used to only retrieve the next upcoming break for a space.

## Implementation / Requisite Infrastructure

This project uses [Serverless](https://serverless.com/) for Node.js on top of [AWS Lambda](https://aws.amazon.com/lambda/). Serverless handles deployment and setup. See the Serverless docs for generating credentials to the hosting cloud platform. All AWS infrastructure for this project can be utilized under the AWS Free Tier. Using a serverless architecture allows for rapid deployment for minimal cost and maintenance.

### Slack App

A Slack app must be created and named first.

Uses a Slack custom integration / app. The app uses the Slash Command functionality, and points it's outbound request as a POST to the AWS Lambda address (obtained from AWS once Lambda function has been deployed). The Slack Token ID is also needed in the Serverless configuration as an environment variable, and the Lambda function will use the app Token ID to ensure that the request coming into Lambda came from your Slack instance.

### AWS

#### Lambda

Two functions are defined: a parse function and a R25 web service (r25ws) function.

- Parse: verify the command can be processed and send feedback to Slack with result
- r25ws (handler): Communicate with the R25 web service to gather schedule information and then respond appropriately to Slack

#### SNS

Glues the two Lambda functions together, allows the parse handler to pass command information to the r25ws handler. Can later be used to trigger additional or different functions depending on later developments. All configuration and AWS permissions are defined in the `serverless.yml` file.

#### Environment Variables

Environment variables are stored as .json files in a folder named 'env-vars' in the root of the project directory. Store secrets, such as R25 Web Service API credentials, Slack ID Tokens, etc. in these json files. Below are examples:

##### env-vars/r25ws.json

```json
{
    "user": "r25 web service username",
    "password": "r25 web service password",
    "baseUrl": "https://webservices.collegenet.com/r25ws/wrd/{instance name}/run/"
}
```

##### env-vars/slack.json

```json
{
    "dev": {
        "slack-token": "xxxxxxxxxxxxxxxxxxxxxxxx"
    },
    "prod": {
        "slack-token": "xxxxxxxxxxxxxxxxxxxxxxxx"
    }
}
```

### Testing / Dev instancing

Automated testing implemented with [Mocha](https://mochajs.org/), [Chai](http://www.chaijs.com/), and [simple-mock](https://github.com/jupiter/simple-mock). CI integrated on github (github actions). These tests ensure that basic functionality continues to work properly. Setting the stage in `serverless.yml` to 'dev' allows for testing on a remote server without affecting production instance(s). Set up a separate 'team' on Slack, and create a custom integration app for testing out / development and use the separate slack token for access. More than one stage of the program can also be deployed to Lambda simultaneously, as each deployment will create a separate endpoint on AWS.

#### Run Tests

> `npm run test`

#### Code Coverage

> `npm run coverage`

#### Github Actions

Automated testing enabled on github actions. Secrets are saved on github under the repository settings and are retrieved at runtime by the test runner environment.

## Updates

### Deploying new versions

From a terminal in the project root, run `npx sls deploy [function -f {function_name}]`. `npx` ensures that the local installation of serverless is used, rather than any possible globally-installed version (`sls` is an alias for `serverless`).

**NOTE** The stage **DOES NOT** override what is saved in the serverless configuration file (`serverless.yml`)! Update the stage setting in the file to either "dev" or "prod" before running the above deploy command.

#### Updates to spaces / space ids

Updating `spaces.json` requires updating the **parse** function.

## Contributing

All contributions, issues/bug reports, and questions are welcome.
