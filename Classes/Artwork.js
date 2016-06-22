const http = require('http');

class Artwork {
  constructor (artUri, plexClient) {
    this.uri = artUri;
    this.bin = plexClient.query(artUri);
  }
}

module.exports = Artwork;