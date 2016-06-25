const { expect } = require('chai');
const Plexacious = require('../lib/Plexacious');
const config = {
  "hostname": process.env.PLEX_SERVER_HOST,
  "port": process.env.PLEX_SERVER_PORT,
  "https": process.env.PLEX_SERVER_HTTPS,
  "token": process.env.PLEX_AUTH_TOKEN
};

const plex = new Plexacious(config);

describe('Plexacious:', () => {
  describe('Event attaching:', () => {
    it('should instantiate with no events', () => {
      expect(plex.events()).to.deep.equal({});
      expect(typeof plex.events('test')).to.equal('undefined');
    });

    it('should attach a callback to an event', () => {
      plex.on('test', () => {});
      expect(Object.keys(plex.events()).length).to.equal(1);
      expect(typeof plex.events('test')).to.equal('function');
    });
  });

  describe('Recently Added:', () => {

  });
});