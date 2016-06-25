# plexacious

A Plex bot library for integration with chat bots.

## Installation

```
npm install plexacious
npm run configure
```

## Usage

### Initialize
```Javascript
const Plexacious = require('plexacious');
const config = require('./config');

const bot = new Plexacious(config); // Alternatively, construct your own config object and pass it in
```

### API

#### setRefreshDuration

`setRefreshDuration(timer)`

Clear the current digest timer and set a new interval timer for the digest process.

##### Parameters:
- `{integer} timer`: The desired interval between digest processes, in minutes.

##### Return:
Returns the Plexacious object instance for method chaining.

##### Example:

```Javascript
bot.setRefreshDuration(30);
```

#### on

`on(event[, callback])`

Attach or detach a callback function to an event

##### Parameters:
- `{string} event`: The event to which to attach or from which to detach the callback function.
- `{function} callback`: The callback function to attach to the event. If not provided, the existing callback function on this event will be detached, if any.

##### Return:
Returns the Plexacious object instance for method chaining.

##### Example:
```Javascript
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
```Javascript
let library = await bot.query('/library');
```

```Javascript
bot.query('/library').then(things => {
  console.dir(things);
});
```

### Events

#### mediaAdded

Called when a new piece of media has been discovered in Plex's "Recently Added" section