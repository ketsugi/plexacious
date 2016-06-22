const { expect } = require('chai');
const Plexacious = require('../Plexacious');

const plex = new Plexacious();

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