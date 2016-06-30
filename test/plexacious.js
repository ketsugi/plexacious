const { expect } = require('chai');
const Plexacious = require('../src/Plexacious');
const config = {
  hostname: 'macedonia.ketsugi.com',
  token: process.env.PLEX_AUTH_TOKEN
}

let plex = new Plexacious();
plex.setLogLevel('none');

describe('Plexacious:', () => {
  describe('Environment:', () => {
    it('should read the environment variable correctly', () => {
      expect(config.token).to.not.be.null;
    });
  });
});