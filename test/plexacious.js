const { expect } = require('chai');
const Plexacious = require('../js/Plexacious');

const plex = new Plexacious();

describe('Plexacious:', () => {
  describe('Event attaching:', () => {
    it('should attach a callback to an event', () => {
      plex.on('test', () => {});
      expect(plex._eventEmitter.listenerCount('test')).to.equal(1);
    });

    it('should detach the callback if no function is passed', () => {
      plex.on('test');
      expect(plex._eventEmitter.listenerCount('test')).to.equal(0);
    });
  });

  describe('Recently Added:', () => {

  });
});