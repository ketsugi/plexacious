const Plexacious = require('./lib/Plexacious');
const config = require('./config');
const plex = new Plexacious(config);

plex
  .on('init', () => {
    console.log('Init');
  })
  .on('mediaAdded', media => {
    console.log('Media', media.title);
  });