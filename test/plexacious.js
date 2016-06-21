const { expect } = require('chai');
const Plexacious = require('../');

describe('Plexacious:', function() {
  describe('Class basics:', function() {
    it('should instantiate a new Plexacious object', function() {
      let p = new Plexacious();
      expect(typeof p).to.equal('object');
      expect(p.constructor.name).to.equal('Plexacious');
    })
  })
});