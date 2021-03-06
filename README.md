# plexacious
[![npm version](https://badge.fury.io/js/plexacious.svg)](https://badge.fury.io/js/plexacious)
[![Build Status](https://travis-ci.org/ketsugi/plexacious.svg?branch=master)](https://travis-ci.org/ketsugi/plexacious)
[![Known Vulnerabilities](https://snyk.io/test/github/ketsugi/plexacious/badge.svg)](https://snyk.io/test/github/ketsugi/plexacious)

A Plex bot library for integration with chat bots.

## :warning: Warning
_This package should be considered *unstable*. APIs may change between 0.x releases as I continue to work on it._

## Installation

```
npm install plexacious
npm run configure
```

## Usage

### Initialize
```js
const Plexacious = require('plexacious');
const config = require('./config');

const bot = new Plexacious();

bot.init(config) // Alternatively, construct your own config object and pass it in
```

### API

### init

`init(config[, callback])`

Set up the Plex server information and start the digest timer.

##### Parameters
- `{Object} config`: The configuration settings for the Plex server connection.
- `{function} callback`: (*optional*) The callback function which will be called when init is complete.

##### Return
Returns the Plexacious object instance for method chaining.

##### Example
```js
bot.init({
  hostname: 'localhost',
  port: 1234,
  https: false,
  token: 'abcdefg',
  refreshDuration: 30,
}, () => console.log('Bot initialized'));
```

### start
`start()`

Start the bot. This will start the digest timer. If the bot is already stopped, this will do nothing.

##### Return
Returns the Plexacious object instance for method chaining.

### stop
`stop()`

Stop the bot. This will clear any existing digest timer. If the bot is already stopped, this will do nothing.

### exit
`exit(exitCode)`

Kills the bot's process completely.

##### Parameters
- `{number} exitCode`: (*optional*) The exit code with which to exit the process. Defaults to 0 if not provided.

#### setRefreshDuration

`setRefreshDuration(timer)`

Clear the current digest timer and set a new interval timer for the digest process. This will also cause the digest to run immediately (so that it's not possible to indefinitely delay the digest by constantly changing the timer).

##### Parameters:
- `{integer} timer`: The desired interval between digest processes, in minutes.

##### Return:
Returns the Plexacious object instance for method chaining.

##### Example:

```js
bot.setRefreshDuration(30);
```

#### on

`on(event[, callback])`

Attach or detach a callback function to an event

##### Parameters:
- `{string} event`: The event to which to attach or from which to detach the callback function.
- `{function} callback`: (*optional*) The callback function to attach to the event. If not provided, the existing callback function on this event will be detached, if any.

##### Return:
Returns the Plexacious object instance for method chaining.

##### Example:
```js
bot.on('mediaAdded', (media) => console.log(media.title));
```

#### query

`query(path)`

Performs a GET action on the provided path on the Plex server, and returns the objects

##### Parameters:
- `{string} path`: The API path to request

##### Return:
A Promise that resolves to an array of objects

##### Example:
```js
let library = await bot.query('/library');
```

```js
bot.query('/library').then(things => {
  console.dir(things);
});
```

### Events

#### `startDigest`

Called every time the digest starts, before any calls to the Plex API are made.

#### `endDigest`

Called every time the digest ends, after all API calls.

#### `newSession`

Called when a new streaming session is detected. Takes the session object as an argument.

#### `endSession`

Called when a streaming session is detected to have ended. Takes the session object as an argument.

#### `newMedia`

Called when a new piece of media has been discovered in Plex's "Recently Added" section. Takes the media object as an argument.

##### Example:
```js
bot.on('newMedia', (media) => console.log(media.title));
```