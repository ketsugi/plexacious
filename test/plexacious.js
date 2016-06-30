const { expect } = require('chai');
const Plexacious = require('../src/Plexacious');
const config = {
  hostname: 'macedonia.ketsugi.com',
  token: process.env.PLEX_AUTH_TOKEN
}

let plex = new Plexacious();
plex.setLogLevel('error');

describe('Plexacious:', () => {
  describe('Test Environment:', () => {
    it('should read the environment variable correctly', () => {
      expect(config.token).to.not.be.null;
    });
  });

  describe('Constructor:', () => {
    it('should initialize a blank cache', () => {
      expect(Object.keys(plex.cache)).to.deep.equal(['recentlyAdded', 'servers', 'sessions']);
      expect(Object.keys(plex.cache.recentlyAdded).length).to.equal(0);
      expect(Object.keys(plex.cache.servers).length).to.equal(0);
      expect(Object.keys(plex.cache.sessions).length).to.equal(0);
    });
  });

  describe('Initialization:', () => {
    it('should return the Plexacious object', () => {
      expect(plex.init(config)).to.equal(plex);
    });
  });

  describe('Start', () => {
    it('should return the Plexacious object', () => {
      expect(plex.start()).to.equal(plex);
    });
    it('should switch on the running flag', () => {
      expect(plex.running).to.be.true;
    });
  });

  describe('Stop', () => {
    it('should return the Plexacious object', () => {
      expect(plex.stop()).to.equal(plex);
    });
    it('should switch off the running flag', () => {
      expect(plex.running).to.be.false;
    });
    it('should clear the timer', () => {
      expect(plex._timeoutObj).to.be.undefined;
    });
  });
});