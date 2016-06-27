const Plexacious = require('./js/Plexacious');
const config = require('./config');
const plex = new Plexacious(config);

plex
  .on('newMedia', media => console.log('Media', media.title))
  .init(config);