const { expect } = require('chai');
const Plexacious = require('../');
const plexConfig = {
  hostname: 'macedonia.ketsugi.com',
  token: 'ntjA6xHPg1puxkBBZjH5'
};

describe('Plexacious:', () => {
  describe('Class basics:', () => {
    it('should instantiate a new Plexacious object', () => {
      let p = new Plexacious();
      expect(typeof p).to.equal('object');
      expect(p.constructor.name).to.equal('Plexacious');
    });
  });

  describe('Macedonia tests:', () => {
    let p = new Plexacious(plexConfig);

    it('should retrieve the current sessions', async () => {
      expect(Array.isArray(await p.sessions)).to.be.true;
    });

    it('should retrieve a list of servers', async () => {
      expect(Array.isArray(await p.servers)).to.be.true;
    })
  })
});