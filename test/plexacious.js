const { expect } = require('chai');
const Plexacious = require('../src/Plexacious');
const config = {
  hostname: 'macedonia.ketsugi.com',
  token: process.env.PLEX_AUTH_TOKEN
}

const plex = new Plexacious();

describe('Plexacious:', () => {
});