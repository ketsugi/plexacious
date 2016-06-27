const Plexacious = require('./js/Plexacious');
const config = require('./config');
config.refreshDuration = 1;
const plex = new Plexacious(config);

plex
  .on('newMedia', media => console.log('Media', media.title))
  .init(config);